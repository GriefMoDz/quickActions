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

class QuickActions extends Plugin {
  async startPlugin () {
    this.loadCSS(resolve(__dirname, 'core/styles/style.scss'));

    if (!this.initializedStore) {
      await this.initializeStore();
    }

    this.utils = require('./core/utils');
    this.sortedGuildsStore = (await getModule([ 'getSortedGuilds' ]));
    this.patchSettingsContextMenu();
  }

  pluginWillUnload () {
    uninject('quickActions-ContextMenu');
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

      const parent = React.createElement(Submenu, {
        name: 'Powercord',
        hint: '\uD83D\uDD0C',
        onClick: () => this.utils.openUserSettings(),
        getItems: () => items
      });

      const changelog = res.props.children[0].find(c => c.key === 'changelog');
      if (changelog) {
        res.props.children[0].splice(res.props.children[0].indexOf(changelog), 0, parent);
      } else {
        this.error('Could not find \'Change Log\' category item - unloading for the remainder of this instance...');
        this._unload();
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
              item.highlight = setting.dangerous ? '#F04747' : setting.color || null;

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
                item.highlight = '#43B581';
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
              } else if (typeof setting.disabled !== 'undefined') {
                if (setting.disabled.func && setting.disabled.func.method.includes('!getSetting')) {
                  item.disabled = !powercord.api.settings.store
                    .getSetting(id, setting.disabled.func.arguments);
                } else if (setting.disabled.func && setting.disabled.func.method.includes('getSetting')) {
                  item.disabled = powercord.api.settings.store
                    .getSetting(id, setting.disabled.func.arguments);
                } else {
                  item.disabled = setting.disabled;
                }
              }

              item.hint = setting.hint;

              if (setting.modal) {
                item.highlight = '#43B581';
                item.hint = 'Modal »';
                item.onClick = () => this.showSettingModal({ name,
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
              }

              setting.children.forEach(obj => {
                const child = {
                  type: obj.type ? obj.type : 'checkbox',
                  name: obj.name
                };

                if (obj.seperate) {
                  child.seperate = true;
                }

                switch (child.type) {
                  case 'button':
                    child.highlight = obj.dangerous ? '#F04747' : obj.color || null;

                    if (typeof obj.disabled !== 'undefined') {
                      if (obj.disabled.func && obj.disabled.func.method.includes('!getSetting')) {
                        if (
                          !powercord.api.settings.store
                            .getSetting(id, obj.disabled.func.arguments) && obj.disabled.hide
                        ) {
                          return false;
                        }

                        child.disabled = !powercord.api.settings.store
                          .getSetting(id, obj.disabled.func.arguments);
                      } else if (obj.disabled.func && obj.disabled.func.method.includes('getSetting')) {
                        if (
                          powercord.api.settings.store
                            .getSetting(id, obj.disabled.func.arguments) && obj.disabled.hide
                        ) {
                          return false;
                        }

                        child.disabled = powercord.api.settings.store
                          .getSetting(id, obj.disabled.func.arguments);
                      } else {
                        child.disabled = obj.disabled;
                      }
                    }

                    if (obj.modal) {
                      child.highlight = '#43B581';
                      child.hint = 'Modal »';
                      child.onClick = () => {
                        if (obj.key === 'passphrase') {
                          return this.showPassphraseModal({ setting: obj });
                        }

                        this.showSettingModal({ name,
                          id,
                          setting: obj,
                          key: obj.key });
                      };

                      break;
                    }

                    child.onClick = () => powercord.pluginManager.get(id)[obj.func.method]();
                    break;
                  default:
                    child.defaultState = powercord.api.settings.store.getSetting(id, obj.key, obj.default);
                    child.onToggle = (state) => {
                      toggleSetting(id, obj.key, state);

                      if (obj.close) {
                        contextMenu.closeContextMenu();
                      }

                      if (obj.key === 'settingsSync' && state) {
                        this.showPassphraseModal({ setting: obj });
                      }

                      item.defaultState = state;
                    };
                }

                children.push(child);
              });

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
                  powercord.pluginManager.get(plugin.id).settings.set(key, parseInt(value));

                  return forceUpdateElement('.pc-titleBar');
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

            if (this.settingsStore.get('plugins')[id]) {
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

  showSettingModal (opts) {
    const SettingModal = require('./core/components/SettingModal');
    openModal(() => React.createElement(SettingModal, {
      onConfirm: (value) => {
        updateSetting(opts.id, opts.key, value);

        if (typeof opts.setting.func !== 'undefined') {
          if (opts.setting.func.method && opts.setting.func.type === 'pluginManager') {
            powercord.pluginManager.get(opts.id)[opts.setting.func.method]();
          }
        }
      },
      options: opts }));
  }
}

module.exports = QuickActions;
