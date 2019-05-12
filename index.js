// loosely based on and inspired by https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/BDContextMenu/BDContextMenu.plugin.js

const { remote } = require('electron');
const { Plugin } = require('powercord/entities');
const { ContextMenu: { Submenu } } = require('powercord/components');
const { forceUpdateElement, sleep } = require('powercord/util');
const { getModule, getModuleByDisplayName, React, contextMenu } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

const { actions: { toggleSetting, updateSetting } } = powercord.api.settings;

const path = require('path');
const fs = require('fs');

class QuickActions extends Plugin {
  async startPlugin () {
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
    return path.join(__dirname, 'store', 'settings.json');
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
        getItems: () => items.map(item => {
          const settingItem = {
            type: item.type,
            name: item.name,
            width: item.width,
            onClick: item.onClick
          };

          if (item.type === 'submenu') {
            settingItem.getItems = () => item.getItems().map(i => {
              i.seperate = true;
              return i;
            });
          }

          return settingItem;
        })
      });

      const changelog = res.props.children.find(c => c.key === 'changelog');
      if (changelog) {
        res.props.children.splice(res.props.children.indexOf(changelog), 0, parent);
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
                item.onClick = () => remote.getCurrentWindow().webContents.session.clearCache();
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
              }

              item.onClick = () => powercord.pluginManager.get(id)[setting.func.method]();
              break;
            case 'submenu':
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
                  child.seperate = obj.seperate;
                }

                switch (child.type) {
                  case 'button':
                    child.highlight = obj.dangerous ? '#F04747' : obj.color || null;

                    if (obj.key === 'pluginDirectory') {
                      child.name = pluginPath;
                      child.onClick = () => this.utils.openFolder(pluginPath);
                      break;
                    } else if (
                      obj.key === 'checking' &&
                      !powercord.api.settings.store.getSetting(id, 'checkForUpdates', true)
                    ) {
                      return;
                    }

                    if (typeof obj.disabled !== 'undefined') {
                      if (obj.disabled.func && obj.disabled.func.method.includes('!getSetting')) {
                        child.disabled = !powercord.api.settings.store
                          .getSetting(id, obj.key,
                            setting.children.find(x => x.key === obj.disabled.func.arguments).default);
                      } else if (obj.disabled.func && obj.disabled.func.method.includes('getSetting')) {
                        child.disabled = powercord.api.settings.store
                          .getSetting(id, obj.key,
                            setting.children.find(x => x.key === obj.disabled.func.arguments).default);
                      } else {
                        child.disabled = obj.disabled;
                      }
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

                      item.defaultState = state;
                    };
                }

                children.push(child);
              });

              item.hint = setting.hint;

              if (key === 'pluginDirectory') {
                item.width = `${(pluginPath.length * 6.7)}px`;
              } else {
                item.width = setting.width || '';
              }

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

              item.handleSize = 10;
              item.defaultValue = powercord.api.settings.store.getSetting(id, key, setting.default);

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
                  powercord.pluginManager.get('advanced-title-bar').settings.set(key, parseInt(value));

                  return forceUpdateElement('.pc-titleBar');
                }

                updateSetting(id, key, parseInt(value));

                if (id === 'auditory') {
                  powercord.pluginManager.get(id).reload();
                }
              };

              item.onValueRender = (value) => setting.suffix ? `${value.toFixed(0)}${setting.suffix}` : value.toFixed(0);
              break;
            default:
              if (
                (key === 'settingsSync' && !powercord.account) || ((key === 'clearContent' || key === 'useShiftKey') &&
                powercord.api.settings.store.getSetting(id, 'dualControlEdits', false)) || (key === 'displayLink' &&
                powercord.api.settings.store.getSetting(id, 'useEmbeds', false))
              ) {
                continue;
              }

              item.defaultState = powercord.api.settings.store.getSetting(id, key, setting.default);
              item.onToggle = (state) => {
                toggleSetting(id, key);

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
          onToggle: (state) => {
            item.defaultState = state;

            if (this.settingsStore.get('plugins')[id] || id === 'advanced-title-bar') {
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
}

module.exports = QuickActions;
