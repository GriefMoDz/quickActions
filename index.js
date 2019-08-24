// loosely based on and inspired by https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/BDContextMenu/BDContextMenu.plugin.js

const { Plugin } = require('powercord/entities');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

const { ImageMenuItem, MenuItem, ToggleMenuItem } = require('./core/components/ContextMenu');

class QuickActionsR extends Plugin {
  constructor (props) {
    super(props);

    this.state = {
      initializedStore: false,
      settings: require('./core/store/settings')(this)
    };

    this.utils = require('./core/utils')(this);
  }

  get settingsStore () {
    return this.store || (this.store = new Map());
  }

  async startPlugin () {
    this.loadCSS(require('path').resolve(__dirname, 'core/styles/style.scss'));

    if (!this.state.initializedStore) {
      this.initializeStore();
    }

    this.state.sortedGuildsStore = (await getModule([ 'getSortedGuilds' ]));
    this.state.SubMenuItem = (await getModuleByDisplayName('FluxContainer(SubMenuItem)'));

    this.patchSettingsContextMenu();
  }

  pluginWillUnload () {
    uninject('quickActions-SettingsContextMenu');

    this.utils.forceUpdate(false);
  }

  initializeStore () {
    this.state.settings.forEach(plugin => {
      this.settingsStore.set('plugins', plugin);
    });

    this.utils.checkForUpdates();
    this.state.initializedStore = true;
  }

  async patchSettingsContextMenu () {
    const { SubMenuItem } = this.state;

    const SettingsContextMenu = (await getModuleByDisplayName('UserSettingsCogContextMenu'));
    inject('quickActions-SettingsContextMenu', SettingsContextMenu.prototype, 'render', (_, res) => {
      const items = [];

      powercord.api.settings.tabs.forEach(item => {
       items.push(item.section === 'pc-pluginManager'
          ? this.buildContentMenu(true)
          : this.buildSettingMenu(item.label, item.section));
      });

      if (powercord.pluginManager.isEnabled('pc-styleManager')) {
        const pluginsMenu = items.find(item => item.props.label === 'Plugins');
        if (pluginsMenu) {
          items.splice(items.indexOf(pluginsMenu) + 1, 0, this.buildContentMenu());
        } else {
          items.push(this.buildContentMenu());
        }
      }

      const parent = React.createElement(SubMenuItem, {
        label: 'Powercord',
        invertChildY: true,
        render: items,
        action: () => this.utils.openUserSettings()
      });

      const children = res.props.children.find(child => child);
      const changelog = children.find(child => child && child.key === 'changelog');
      if (changelog) {
        children.splice(children.indexOf(changelog), 0, parent);
      } else {
        this.error('Could not find \'Change Log\' category; pushing element to main children instead!');

        res.props.children.push(parent);
      }

      return res;
    });

    this.utils.forceUpdate();
  }

  buildSettingMenu (name, id) {
    const { SubMenuItem } = this.state;

    const items = [];
    const plugin = this.settingsStore.get('plugins')[id];
    if (plugin) {
      for (const key in plugin.settings) {
        const setting = plugin.settings[key];
        if (setting) {
          let item;

          switch (setting.type) {
            case 'button':
              item = require('./core/types/button').bind(this, id, key, plugin, setting, name)();

              break;
            case 'submenu':
              if (typeof setting.hide === 'function'
                ? setting.hide.bind(this, (plugin.id ? { id } = plugin.id : id)).call()
                : setting.hide
              ) {
                continue;
              }

              item = require('./core/types/submenu').bind(this, id, key, plugin, setting, name)();

              break;
            case 'slider':
              item = require('./core/types/slider').bind(this, id, key, plugin, setting)();

              break;
            default:
              item = require('./core/types/checkbox').bind(this, id, key, plugin, setting)();
          }

          Object.keys(item.props).forEach(key => !item.props[key] ? delete item.props[key] : '');

          items.push(item);
        }
      }
    }

    const props = {
      label: name,
      action: () => this.utils.showCategory(id)
    };

    if (items.length > 0) {
      return React.createElement(SubMenuItem, {
        ...props,
        invertChildY: true,
        render: items
      });
    }

    return React.createElement(MenuItem, {
      ...props
    });
  }

  buildContentMenu (checkForPlugins) {
    const { SubMenuItem } = this.state;
    const { plugins, disabledPlugins } = this.utils.getPlugins();
    const { themes, disabledThemes } = this.utils.getThemes();

    const items = [];
    const submenu = React.createElement(SubMenuItem, {
      label: checkForPlugins ? 'Plugins' : 'Themes',
      invertChildY: true,
      render: items,
      action: () => checkForPlugins ? this.utils.showCategory('pc-pluginManager') : null
    });

    const children = [];

    for (const key in checkForPlugins ? plugins : themes) {
      const id = (checkForPlugins ? plugins : themes)[key];
      const metadata = (checkForPlugins ? powercord.pluginManager : powercord.styleManager).get(id).manifest;
      const isContentDisabled = (checkForPlugins ? disabledPlugins : disabledThemes).includes(id);
      const props = {
        label: id,
        desc: `${metadata.name}${metadata.author !== 'Unknown' ? ` by ${metadata.author} ` : ' '}(v${metadata.version})`,
        seperated: children.length < 1 ? true : ''
      };

      let child;

      if (checkForPlugins) {
        const hiddenPlugins = powercord.api.settings.store.getSetting('pc-general', 'hiddenPlugins', []);

        child = React.createElement(require('./core/components/ContextMenu/SubMenuItem'), {
          ...props,
          invertChildY: true,
          render: [ React.createElement(ToggleMenuItem, {
            label: 'Hidden',
            active: hiddenPlugins.includes(id),
            action: (state) => {
              if (state) {
                hiddenPlugins.push(id);
              } else {
                hiddenPlugins.splice(hiddenPlugins.indexOf(id), 1);
              }

              powercord.api.settings.actions.updateSetting('pc-general', 'hiddenPlugins', hiddenPlugins);

              this.utils.forceUpdate();
            }
          }), React.createElement(ToggleMenuItem, {
            label: 'Enabled',
            active: !isContentDisabled,
            action: () => ((this.utils.togglePlugin(id), this.utils.forceUpdate()))
          }), React.createElement(ImageMenuItem, {
            label: 'Reload Plugin',
            image: 'fa-sync',
            styles: { color: '#43b581' },
            seperated: true,
            action: async () => {
              await powercord.pluginManager.remount(id);

              if (!powercord.pluginManager.isEnabled(id)) {
                powercord.pluginManager.unload(id);
              }

              this.utils.forceUpdate();
            }
          }), !(/^pc-[a-zA-Z0-9]+$/).test(id)
            ? React.createElement(ImageMenuItem, {
              label: 'Uninstall Plugin',
              image: 'fa-trash-alt',
              danger: true,
              action: () => this.utils.showUninstallModal(id, metadata)
            })
            : null ]
        });
      } else {
        child = React.createElement(ToggleMenuItem, {
          ...props,
          active: !isContentDisabled,
          action: () => this.utils.toggleTheme(id)
        });
      }

      children.push(child);
    }

    items.push(React.createElement(SubMenuItem, {
      label: `Installed ${checkForPlugins ? 'Plugins' : 'Themes'} (${children.length})`,
      invertChildY: true,
      render: children
    }));

    if (checkForPlugins) {
      children.splice(0, 0, React.createElement(ToggleMenuItem, {
        label: 'Show Hidden Plugins',
        active: this.settings.get('showHiddenPlugins', false),
        action: (state) => ((this.settings.set('showHiddenPlugins', state), this.utils.forceUpdate()))
      }));
    }

    items.push(React.createElement(ImageMenuItem, {
      label: `Open ${checkForPlugins ? 'Plugins' : 'Themes'} Folder`,
      image: 'fa-folder-open',
      styles: { color: '#7289da' },
      seperated: true,
      action: () => this.utils.openFolder(`${checkForPlugins
        ? powercord.pluginManager.pluginDir
        : powercord.styleManager.themesDir}`)
    }));

    return submenu;
  }

  getGuilds () {
    return this.state.sortedGuildsStore.getFlattenedGuilds();
  }
}

module.exports = QuickActionsR;
