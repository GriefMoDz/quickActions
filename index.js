// loosely based on and inspired by https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/BDContextMenu/BDContextMenu.plugin.js

const { remote } = require('electron');
const { Plugin } = require('powercord/entities');
const { ContextMenu: { Submenu } } = require('powercord/components');
const { open: openModal, close: closeModal } = require('powercord/modal');
const { forceUpdateElement, sleep } = require('powercord/util');
const { getModule, getModuleByDisplayName, React, contextMenu } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { resolve } = require('path');

const { actions: { toggleSetting, updateSetting } } = powercord.api.settings;

const GenericModal = require('./core/components/Modal');

const path = require('path');
const fs = require('fs');

let pressed = false;

class QuickActions extends Plugin {
  async startPlugin () {
    this.loadCSS(resolve(__dirname, 'core/styles/style.scss'));

    if (!this.initializedStore) {
      await this.initializeStore();
    }

    this.utils = require('./core/utils');
    this.sortedGuildsStore = (await getModule([ 'getSortedGuilds' ]));
    this.titleBarClasses = (await getModule([ 'titleBar' ]));

    this.patchSettingsContextMenu();
    this.patchSettingsSections();
  }

  pluginWillUnload () {
    uninject('quickActions-ContextMenu');
    uninject('quickActions-SettingsSections');
  }

  // Getters
  get settingsPath () {
    return path.join(__dirname, 'core', 'store', 'settings.json');
  }

  get settingsStore () {
    return this.store || (this.store = new Map());
  }

  get settingsSections () {
    return powercord.api.settings.tabs;
  }

  async initializeStore () {
    const rawFile = await fs.readFileSync(this.settingsPath);
    const file = await JSON.parse(rawFile);

    file.forEach(plugin => {
      this.settingsStore.set('plugins', plugin);
    });

    this.initializedStore = true;
  }

  async patchSettingsContextMenu () {
    const SettingsContextMenu = (await getModuleByDisplayName('UserSettingsCogContextMenu'));
    inject('quickActions-ContextMenu', SettingsContextMenu.prototype, 'render', (_, res) => {
      const items = [];

      this.settingsSections.forEach(item => {
        items.push(item.section === 'pc-pluginManager'
          ? this.buildPluginsMenu()
          : this.buildSettingMenu(item.label, item.section));
      });

      if (powercord.pluginManager.isEnabled('pc-styleManager')) {
        const plugins = items.find(c => c.name === 'Plugins');
        if (plugins) {
          items.splice(items.indexOf(plugins) + 1, 0, this.buildStylesMenu());
        } else {
          items.push(this.buildStylesMenu());
        }
      }

      const parent = React.createElement(Submenu, {
        name: 'Powercord',
        className: 'quickActions-contextMenu',
        iconClassName: 'quickActions-contextMenu-icon',
        image: this.utils.getPowercordIcon(),
        onClick: () => {
          pressed = true;
          this.utils.openUserSettings();
        },
        getItems: () => items
      });

      const changelog = res.props.children[0].find(c => c.key === 'changelog');
      if (changelog) {
        res.props.children[0].splice(res.props.children[0].indexOf(changelog), 0, parent);
      } else {
        this.error('Could not find \'Change Log\' category; unloading for the remainder of this instance...');
        this._unload();
      }

      return res;
    });
  }

  async patchSettingsSections () {
    const UserSettingsSections = (await getModule([ 'getUserSettingsSections' ]));

    inject('quickActions-SettingsSections', UserSettingsSections.prototype, 'render', (_, res) => {
      if (pressed && res.props && !res.props.section) {
        res.props.section = 'pc-general';
        pressed = false;
      }

      return res;
    });
  }

  buildSettingMenu (name, id) {
    const items = [];
    const plugin = this.settingsStore.get('plugins')[id];

    if (plugin) {
      for (const key in plugin.settings) {
        const setting = plugin.settings[key];
        const pluginPath = powercord.pluginManager.pluginDir;

        if (setting) {
          const children = [];
          const item = {
            type: setting.type ? setting.type : 'checkbox',
            name: setting.name ? setting.name : key
          };

          if (setting.seperate) {
            item.seperate = true;
          }

          switch (setting.type) {
            case 'button':
              item.highlight = setting.dangerous ? '#f04747' : setting.color || null;

              if (!setting.image) {
                item.hint = setting.hint;
              } else {
                item.image = setting.image;
              }

              if (id === 'auditory' && setting.func.method === 'updateSetting') {
                const mode = powercord.api.settings.store.getSetting(id, key, setting.default);
                const value = mode === setting.default
                  ? setting.func.newValue
                  : setting.default;

                item.name = mode === setting.default ? 'Switch to FFT' : 'Switch to Amplitude';
                item.hint = mode !== setting.default ? 'FFT' : 'Amp';
                item.onClick = () => {
                  updateSetting(id, key, value);
                  powercord.pluginManager.get(id).reload();
                };

                break;
              } else if (key === 'clearCache') {
                item.onClick = () => openModal(() => React.createElement(GenericModal, {
                  header: 'Clear cache',
                  confirmText: 'Clear Cache',
                  cancelText: 'Cancel',
                  onConfirm: () => remote.getCurrentWindow().webContents.session.clearCache()
                }));

                break;
              } else if (key === 'pluginDirectory') {
                item.highlight = '#43b581';
                item.hint = 'Modal »';
                item.onClick = () => openModal(() => React.createElement(GenericModal, {
                  red: false,
                  header: `Plugin Directory—${name}`,
                  confirmText: 'Done',
                  input: {
                    title: 'Current Working Directory (cwd)',
                    text: pluginPath,
                    disabled: true
                  },
                  button: {
                    text: 'Open Plugin Directory',
                    icon: 'ExternalLink',
                    onClick: () => this.utils.openFolder(pluginPath)
                  },
                  onConfirm: () => closeModal()
                }));

                break;
              } else if (key === 'updatePlugins') {
                item.onClick = async () => {
                  this.utils.showCategory(id);

                  await sleep(1000);

                  const updateBtnContainer = document
                    .getElementsByClassName('plugin-updater-button-container')[0];
                  const updateBtn = updateBtnContainer.children[0];

                  updateBtn.click();
                };

                break;
              } else if (key === 'addUser') {
                item.highlight = '#43b581';
                item.hint = 'Modal »';
                item.onClick = () => openModal(() => React.createElement(GenericModal, {
                  red: false,
                  header: `Add New User—${name}`,
                  confirmText: 'Add User',
                  cancelText: 'Cancel',
                  input: {
                    title: 'User Account Token',
                    text: ''
                  },
                  button: {
                    text: 'Reset to Default'
                  },
                  onConfirm: (token) => {
                    const users = powercord.api.settings.store.getSetting(plugin.id, 'users', []);

                    if (token) {
                      updateSetting(plugin.id, 'users', users.concat([ {
                        nickname: null,
                        token
                      } ]));
                    }

                    closeModal();
                  },
                  options: { setting }
                }));

                break;
              } else if (typeof setting.disabled !== 'undefined') {
                if (setting.disabled.func && setting.disabled.func.method.includes('!getSetting')) {
                  item.disabled = !powercord.api.settings.store
                    .getSetting(id, setting.disabled.func.arguments, Object.entries(plugin.settings)
                      .find(x => x[0] === setting.disabled.func.arguments)[1].default);
                } else if (setting.disabled.func && setting.disabled.func.method.includes('getSetting')) {
                  item.disabled = powercord.api.settings.store
                    .getSetting(id, setting.disabled.func.arguments, Object.entries(plugin.settings)
                      .find(x => x[0] === setting.disabled.func.arguments)[1].default);
                } else {
                  item.disabled = setting.disabled;
                }
              }

              if (setting.modal) {
                item.highlight = '#43b581';

                if (!setting.image) {
                  item.hint = 'Modal »';
                } else {
                  item.image = setting.image;
                }

                item.onClick = () => this.utils.showSettingModal({ name,
                  id,
                  setting,
                  key });

                break;
              }

              item.onClick = () => powercord.pluginManager.get(id)[setting.func.method]();
              break;
            case 'submenu':
              if (key === 'settingsSync' && !powercord.account) {
                continue;
              }

              if (key === 'hiddenGuilds') {
                const hiddenGuilds = powercord.api.settings.store.getSetting(id, key, []);
                this.getGuilds().map(guild => {
                  const child = {
                    type: 'checkbox',
                    name: guild.name,
                    defaultState: hiddenGuilds.includes(guild.id),
                    onToggle: (state) => {
                      this.handleGuildToggle(id, guild.id);
                      child.defaultState = state;
                    }
                  };

                  return children.push(child);
                });

                item.getItems = () => children;
              } else if (key === 'users') {
                const users = powercord.api.settings.store.getSetting(plugin.id, key, []);
                users.map(user => {
                  const child = {
                    type: 'button',
                    name: user.nickname || 'Untitled',
                    seperate: true,
                    onClick: () => openModal(() => React.createElement(GenericModal, {
                      id: 'quickActions-mu-users',
                      red: false,
                      header: `${user.nickname || 'Untitled'}—${name}`,
                      confirmText: 'Done',
                      cancelText: 'Remove User',
                      input: {
                        title: 'Account Token',
                        text: user.token,
                        disabled: true,
                        hidden: {
                          text: 'Show account token',
                          icon: 'Eye'
                        }
                      },
                      onConfirm: () => closeModal(),
                      onCancel: () => {
                        const index = users.indexOf(user);

                        if (index > 0) {
                          updateSetting(plugin.id, 'users', users.filter(u => u !== user));
                        }
                      }
                    }))
                  };

                  return children.push(child);
                });

                item.getItems = () => children;
              }

              for (const childKey in setting.children) {
                const setting = plugin.settings[key].children[childKey];
                const child = {
                  type: setting.type ? setting.type : 'checkbox',
                  name: setting.name
                };

                if (setting.seperate) {
                  child.seperate = true;
                }

                switch (child.type) {
                  case 'button':
                    child.highlight = setting.dangerous ? '#f04747' : setting.color || null;

                    if (!setting.image) {
                      child.hint = setting.hint;
                    } else {
                      child.image = setting.image;
                    }

                    if (typeof setting.disabled !== 'undefined') {
                      if (setting.disabled.func && setting.disabled.func.method.includes('!getSetting')) {
                        if (
                          !powercord.api.settings.store
                            .getSetting(id, setting.disabled.func.arguments, Object.entries(plugin.settings[key].children)
                              .find(x => x[0] === setting.disabled.func.arguments)[1].default) && setting.disabled.hide
                        ) {
                          continue;
                        }

                        child.disabled = !powercord.api.settings.store
                          .getSetting(id, setting.disabled.func.arguments, Object.entries(plugin.settings[key].children)
                            .find(x => x[0] === setting.disabled.func.arguments)[1].default);
                      } else if (setting.disabled.func && setting.disabled.func.method.includes('getSetting')) {
                        if (
                          powercord.api.settings.store
                            .getSetting(id, setting.disabled.func.arguments, Object.entries(plugin.settings[key].children)
                              .find(x => x[0] === setting.disabled.func.arguments)[1].default) && setting.disabled.hide
                        ) {
                          continue;
                        }

                        child.disabled = powercord.api.settings.store
                          .getSetting(id, setting.disabled.func.arguments, Object.entries(plugin.settings[key].children)
                            .find(x => x[0] === setting.disabled.func.arguments)[1].default);
                      } else {
                        child.disabled = setting.disabled;
                      }
                    }

                    if (setting.modal) {
                      child.highlight = '#43b581';

                      if (!setting.image) {
                        child.hint = 'Modal »';
                      } else {
                        child.image = setting.image;
                      }

                      child.onClick = () => {
                        if (childKey === 'passphrase') {
                          return this.showPassphraseModal({ setting });
                        }

                        this.utils.showSettingModal({ name,
                          id,
                          setting,
                          key: childKey });
                      };

                      break;
                    }

                    child.onClick = () => powercord.pluginManager.get(id)[setting.func.method]();
                    break;
                  default:
                    child.defaultState = powercord.api.settings.store.getSetting(id, childKey, setting.default);
                    child.onToggle = (state) => {
                      toggleSetting(id, childKey, state);

                      if (setting.close) {
                        contextMenu.closeContextMenu();
                      }

                      if (childKey === 'settingsSync' && state) {
                        this.showPassphraseModal({ setting });
                      }

                      item.defaultState = state;
                    };
                }

                children.push(child);
              }

              item.hint = setting.hint;
              item.width = setting.width || '';
              item.getItems = () => children;

              break;
            case 'slider':
              if (key === 'limit' && process.platform !== 'win32') {
                continue;
              }

              if (key === 'beastiness' || key === 'brightness') {
                item.color = powercord.api.settings.store.getSetting(id, 'color', null);
              }

              item.mini = setting.mini || true;

              item.minValue = setting.minValue;
              item.maxValue = setting.maxValue;

              if (typeof setting.markers !== 'undefined') {
                item.className = 'quickActions-slider';

                item.equidistant = true;
                item.stickToMarkers = true;
                item.markers = setting.markers;
              }

              item.handleSize = 10;
              item.defaultValue = powercord.api.settings.store.getSetting(typeof plugin.id !== 'undefined'
                ? plugin.id
                : id, key, setting.default);

              if (typeof setting.disabled !== 'undefined') {
                if (setting.disabled.func && setting.disabled.func.method.includes('!isEnabled')) {
                  item.disabled = !powercord.pluginManager.isEnabled(setting.disabled.func.arguments);
                } else if (setting.disabled.func && setting.disabled.func.method.includes('isEnabled')) {
                  item.disabled = powercord.pluginManager.isEnabled(setting.disabled.func.arguments);
                } else {
                  item.disabled = setting.disabled;
                }
              }

              item.onValueChange = (value) => {
                item.defaultValue = value;

                if (id === 'advancedTitle') {
                  const titleBar = `.${this.titleBarClasses.titleBar.replace(/ /g, '.')}`;

                  powercord.pluginManager.get(plugin.id).settings.set(key, parseInt(value));

                  return forceUpdateElement(titleBar);
                }

                updateSetting(id, key, parseInt(value));

                if (id === 'auditory') {
                  powercord.pluginManager.get(id).reload();
                } else if (id === 'wallpaper-changer' && key === 'interval') {
                  powercord.pluginManager.get(id).updateInterval();
                }
              };

              item.onMarkerRender = (value) => {
                if (id === 'wallpaper-changer' && key === 'interval') {
                  return value < 60 ? `${value}min` : `${(value / 60)}hr`;
                }

                return value;
              };

              item.onValueRender = (value) => setting.suffix ? `${value.toFixed(0)}${setting.suffix}` : value.toFixed(0);
              break;
            default:
              if (
                ((key === 'clearContent' || key === 'useShiftKey') &&
                powercord.api.settings.store.getSetting(id, 'dualControlEdits', false)) || (key === 'displayLink' &&
                powercord.api.settings.store.getSetting(id, 'useEmbeds', false))
              ) {
                continue;
              }

              item.defaultState = powercord.api.settings.store.getSetting(typeof plugin.id !== 'undefined'
                ? plugin.id
                : id, key, setting.default);

              item.onToggle = (state) => {
                toggleSetting(typeof plugin.id !== 'undefined'
                  ? plugin.id
                  : id, key);

                if (setting.close) {
                  contextMenu.closeContextMenu();
                } else if (typeof setting.func !== 'undefined') {
                  if (setting.func.method && setting.func.type === 'pluginManager') {
                    powercord.pluginManager
                      .get(id)[setting.func.method](setting.func.arguments
                        ? setting.func.arguments === 'state'
                          ? state
                          : setting.func.arguments
                        : '');
                  }
                }

                item.defaultState = state;
              };
          }

          items.push(item);
        }
      }
    }

    const settingMenu = {
      type: 'button',
      name,
      onClick: () => this.utils.showCategory(id)
    };

    if (items.length > 0) {
      settingMenu.type = 'submenu';
      settingMenu.width = plugin.width;
      settingMenu.getItems = () => items;
    }

    return settingMenu;
  }

  buildPluginsMenu () {
    const items = [];
    const { plugins, disabledPlugins } = this.utils.getPlugins();

    for (const key in plugins) {
      if (plugins.hasOwnProperty(key)) {
        const id = plugins[key];
        const isPluginDisabled = disabledPlugins.includes(id);
        const item = {
          type: 'checkbox',
          name: id,
          defaultState: !isPluginDisabled,
          seperate: true,
          onToggle: (state) => {
            item.defaultState = state;

            if (id === 'pc-styleManager' || this.settingsStore.get('plugins')[id]) {
              contextMenu.closeContextMenu();
            }

            if (!powercord.pluginManager.isEnabled(id)) {
              return powercord.pluginManager.enable(id);
            }

            return powercord.pluginManager.disable(id);
          }
        };

        items.push(item);
      }
    }

    const pluginsMenu = {
      type: 'submenu',
      name: 'Plugins',
      width: '215px',
      onClick: () => this.utils.showCategory('pc-pluginManager'),
      getItems: () => items
    };

    return pluginsMenu;
  }

  buildStylesMenu () {
    const items = [];
    const { themes, disabledThemes } = this.utils.getThemes();

    for (const key in themes) {
      if (themes.hasOwnProperty(key)) {
        const id = themes[key];
        const isThemeDisabled = disabledThemes.includes(id);
        const item = {
          type: 'checkbox',
          name: id,
          defaultState: !isThemeDisabled,
          seperate: true,
          onToggle: (state) => {
            item.defaultState = state;

            if (!powercord.styleManager.isEnabled(id)) {
              return powercord.styleManager.enable(id);
            }

            return powercord.styleManager.disable(id);
          }
        };

        items.push(item);
      }
    }

    const themesMenu = {
      type: 'submenu',
      name: 'Themes',
      width: '215px',
      onClick: () => this.utils.openFolder(powercord.styleManager.themesDir),
      getItems: () => items
    };

    return themesMenu;
  }

  // emoji utility
  getGuilds () {
    return this.sortedGuildsStore.getSortedGuilds().map(g => g.guild);
  }

  handleGuildToggle (id, guildId) {
    const hiddenGuilds = powercord.api.settings.store.getSetting(id, 'hiddenGuilds', []);
    if (!hiddenGuilds.includes(guildId)) {
      return updateSetting(id, 'hiddenGuilds', [ ...hiddenGuilds, guildId ]);
    }

    return updateSetting(id, 'hiddenGuilds', hiddenGuilds.filter(guild => guild !== guildId));
  }

  // settings sync
  showPassphraseModal (opts) {
    openModal(() => React.createElement(GenericModal, {
      red: false,
      header: 'Update passphrase',
      confirmText: 'Update',
      cancelText: 'Cancel',
      input: {
        title: 'Passphrase',
        text: powercord.api.settings.store.getSetting('pc-general', 'passphrase'),
        type: 'password',
        icon: {
          name: 'Eye',
          tooltip: 'Show Password'
        }
      },
      button: {
        text: 'Reset to Default'
      },
      onConfirm: (value) => {
        updateSetting('pc-general', 'passphrase', value);
        closeModal();
      },
      options: opts
    }));
  }
}

module.exports = QuickActions;
