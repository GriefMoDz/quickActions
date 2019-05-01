// loosely based on and inspired by https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/BDContextMenu/BDContextMenu.plugin.js

const { remote } = require('electron');
const { Plugin } = require('powercord/entities');
const { ContextMenu: { Submenu } } = require('powercord/components');
const { sleep } = require('powercord/util');
const { getModuleByDisplayName, getModule, React } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

const path = require('path');
const fs = require('fs');

class QuickActions extends Plugin {
  async startPlugin () {
    if (!this.initializedStore) {
      await this.initializeStore();
    }

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
    const SettingsContextMenu = await getModuleByDisplayName('UserSettingsCogContextMenu');
    inject('quickActions-ContextMenu', SettingsContextMenu.prototype, 'render', (_, res) => {
      const items = [];

      this.settingsSections.forEach(item => {
        const { label, section } = item;

        items.push(section === 'pc-pluginManager'
          ? this.buildPluginsMenu()
          : this.buildSettingMenu(label, section));
      });

      const parent = React.createElement(Submenu, {
        name: 'Powercord',
        getItems: () => items.map(item => {
          const settingItem = {
            type: item.type,
            name: item.name,
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
        let pluginDir;
        const setting = plugin.settings[key];

        if (setting) {
          const children = [];
          const item = {
            type: setting.type ? setting.type : 'checkbox',
            name: setting.name ? setting.name : key
          };

          const { actions: { toggleSetting, updateSetting } } = powercord.api.settings;

          switch (setting.type) {
            case 'button':
              if (id === 'auditory' && setting.func.method === 'updateSetting') {
                const mode = powercord.api.settings.store.getSetting(id, key, setting.default);
                const value = mode === setting.default
                  ? setting.func.newValue
                  : setting.default;

                item.name = mode === setting.default ? 'Switch to FFT' : 'Switch to Amplitude';
                item.hint = mode === setting.default ? 'Amp' : 'FFT';
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
                  this.showCategory(id);

                  await sleep(500);

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
                      this.handleGuildToggle(guild.id);
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

                switch (child.type) {
                  case 'button':
                    if (obj.key === 'pluginDirectory') {
                      pluginDir = powercord.pluginManager.get(id).cwd.cwd;

                      child.name = pluginDir;
                      child.onClick = () => false;
                      break;
                    }

                    child.onClick = () => powercord.pluginManager.get(id)[obj.func.method]();
                    break;
                  default:
                    child.defaultState = powercord.api.settings.store.getSetting(id, obj.key, obj.default);
                    child.onToggle = (state) => {
                      toggleSetting(id, obj.key, state);
                      item.defaultState = state;
                    };
                }

                children.push(child);
              });

              item.hint = setting.hint;

              if (key === 'pluginDirectory') {
                item.width = `${(pluginDir.length * 6.7)}px`;
              } else {
                item.width = setting.width || '';
              }

              item.getItems = () => children;
              break;
            case 'slider':
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
                  return powercord.pluginManager.get('advanced-title-bar').settings.set(key, parseInt(value));
                }

                return updateSetting(id, key, parseInt(value));
              };
              item.onValueRender = (value) => setting.suffix ? `${value.toFixed(0)}${setting.suffix}` : value.toFixed(0);
              break;
            default:
              if (
                (key === 'settingsSync' && !powercord.account) || ((key === 'clearContent' || key === 'useShiftKey') &&
                powercord.api.settings.store.getSetting(id, 'dualControlEdits', false))
              ) {
                continue;
              }

              item.defaultState = powercord.api.settings.store.getSetting(id, key, setting.default);
              item.onToggle = (state) => {
                toggleSetting(id, key);
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
      onClick: () => this.showCategory(id)
    };

    if (items.length > 0) {
      settingMenu.type = 'submenu';
      settingMenu.getItems = () => items;
    }

    return settingMenu;
  }

  buildPluginsMenu () {
    const items = [];
    const { plugins, disabledPlugins } = this.getPlugins();

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

            if (state && isPluginDisabled) {
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
      onClick: () => this.showCategory('pc-pluginManager'),
      getItems: () => items
    };

    return pluginsMenu;
  }

  async showCategory (sectionId) {
    const UserSettingsWindow = (await getModule([ 'open', 'updateAccount' ]));
    UserSettingsWindow.open();
    UserSettingsWindow.setSection(sectionId);
  }

  getPlugins () {
    const { pluginManager } = powercord;

    const disabledPlugins = powercord.settings.get('disabledPlugins', []);
    const plugins = [ ...pluginManager.plugins.keys() ]
      .sort((a, b) => {
        const filter = a < b
          ? -1
          : 1 || 0;

        return filter;
      });

    return { disabledPlugins,
      plugins };
  }

  getGuilds () {
    return this.sortedGuildsStore.getSortedGuilds().map(g => g.guild);
  }

  handleGuildToggle (guildId) {
    const hiddenGuilds = powercord.api.settings.store.getSetting('pc-emojiUtility', 'hiddenGuilds', []);

    if (!hiddenGuilds.includes(guildId)) {
      powercord.api.settings.actions.updateSetting('pc-emojiUtility', 'hiddenGuilds', [ ...hiddenGuilds, guildId ]);
    } else {
      powercord.api.settings.actions.updateSetting('pc-emojiUtility', 'hiddenGuilds', hiddenGuilds.filter(guild => guild !== guildId));
    }
  }
}

module.exports = QuickActions;
