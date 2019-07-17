// loosely based on and inspired by https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/BDContextMenu/BDContextMenu.plugin.js

const { Plugin } = require('powercord/entities');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

const { ImageMenuItem, MenuItem, ToggleMenuItem } = require('./core/components/ContextMenu');

class QuickActionsR extends Plugin {
  constructor (props) {
    super(props);

    this.state = {
      pressed: false,
      initializedStore: false,
      settings: require('./core/store/settings')()
    };

    this.utils = require('./core/utils');
  }

  get settingsStore () {
    return this.store || (this.store = new Map());
  }

  async startPlugin () {
    this.loadCSS(require('path').resolve(__dirname, 'core/styles/style.scss'));

    if (!this.state.initializedStore) {
      await this.initializeStore();
    }

    this.state.sortedGuildsStore = (await getModule([ 'getSortedGuilds' ]));
    this.state.SubMenuItem = (await getModuleByDisplayName('FluxContainer(SubMenuItem)'));

    this.patchSettingsContextMenu();
    this.patchSettingsSections();
  }

  pluginWillUnload () {
    uninject('quickActions-SettingsContextMenu');
    uninject('quickActions-SettingsSections');

    this.utils.forceUpdate(false);
  }

  async initializeStore () {
    this.state.settings.forEach(plugin => {
      this.settingsStore.set('plugins', plugin);
    });

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
        action: () => {
          this.state.pressed = true;
          this.utils.openUserSettings();
        }
      });

      const changelog = res.props.children[0].find(child => child.key === 'changelog');
      if (changelog) {
        res.props.children[0].splice(res.props.children[0].indexOf(changelog), 0, parent);
      } else {
        this.error('Could not find \'Change Log\' category; unloading for the remainder of this instance.');
        this._unload();
      }

      return res;
    });

    this.utils.forceUpdate();
  }

  async patchSettingsSections () {
    const UserSettingsSections = (await getModule([ 'getUserSettingsSections' ]));
    inject('quickActions-SettingsSections', UserSettingsSections.prototype, 'render', (_, res) => {
      if (this.state.pressed && res.props && !res.props.section) {
        res.props.section = 'pc-general';

        this.state.pressed = false;
      }

      return res;
    });
  }

  buildSettingMenu (name, id) {
    const { SubMenuItem } = this.state;

    const items = [];
    const submenu = React.createElement(SubMenuItem, {
      label: name,
      invertChildY: true,
      render: items,
      action: () => this.utils.showCategory(id)
    });

    const menu = React.createElement(MenuItem, {
      label: name,
      action: () => this.utils.showCategory(id)
    });

    const plugin = this.settingsStore.get('plugins')[id];
    if (plugin) {
      for (const key in plugin.settings) {
        const setting = plugin.settings[key];
        if (setting) {
          let item;

          switch(setting.type) {
            case 'button':  
              item = require('./core/types/button').bind(this, id, key, plugin, setting, name)();

              break;
            case 'submenu':
              if (typeof setting.hide === 'function' ? setting.hide.bind(this,
                (plugin.id ? id = plugin.id : id)).call() : setting.hide
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

          items.push(item);
        }
      }
    }

    if (items.length > 0) {
      return submenu;
    }

    return menu;
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
      action: () => checkForPlugins
        ? this.utils.showCategory('pc-pluginManager')
        : null
    });

    const children = [];

    items.push(React.createElement(SubMenuItem, {
      label: `Installed ${checkForPlugins ? 'Plugins' : 'Themes'}`,
      invertChildY: true,
      render: children
    }));

    for (const key in checkForPlugins ? plugins : themes) {
      const id = (checkForPlugins ? plugins : themes)[key];
      const isContentDisabled = (checkForPlugins ? disabledPlugins : disabledThemes).includes(id);
      const child = React.createElement(ToggleMenuItem, {
        label: id,
        active: !isContentDisabled,
        action: () => {
          if (checkForPlugins) {
            this.utils.togglePlugin(id);
            this.utils.forceUpdate();
          } else {
            this.utils.toggleTheme(id);
          }
        }
      });

      children.push(child);
    }

    items.push(React.createElement(ImageMenuItem, {
      label: `Open ${checkForPlugins ? 'Plugins' : 'Themes'} Folder`,
      image: 'fa-folder-open',
      styles: { color: '#7289da' },
      seperated: true,
      action: () => checkForPlugins
        ? this.utils.openFolder(powercord.pluginManager.pluginDir)
        : this.utils.openFolder(powercord.styleManager.themesDir)
    }));

    return submenu;
  }

  getGuilds () {
    return this.state.sortedGuildsStore.getSortedGuilds().map(g => g.guilds[0]);
  }
}

module.exports = QuickActionsR;
