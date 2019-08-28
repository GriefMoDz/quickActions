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
      settings: require('./core/store/settings')(this),
      communityRepos: []
    };

    this.utils = require('./core/utils')(this);
    this.state.hiddenPlugins = this.utils.getPlugins().hiddenPlugins;
  }

  get settingsStore () {
    return this.store || (this.store = new Map());
  }

  async startPlugin () {
    this.loadCSS(require('path').resolve(__dirname, 'core/styles/style.scss'));

    if (!this.state.initializedStore) {
      this.initializeStore();
    }

    this.utils.getCommunityRepos();

    this.state.sortedGuildsStore = (await getModule([ 'getSortedGuilds' ]));
    this.state.SubMenuItem = (await getModuleByDisplayName('FluxContainer(SubMenuItem)'));

    this.patchSettingsContextMenu();
  }

  pluginWillUnload () {
    uninject('quickActions-SettingsContextMenu');

    this.utils.forceUpdate(false);
  }

  initializeStore () {
    this.state.settings.forEach(plugins => {
      this.settingsStore.set('plugins', plugins);
    });

    Object.keys(this.store.get('plugins')).forEach(id => {
      const plugin = this.store.get('plugins')[id];
      if (typeof plugin.official === 'undefined') {
        plugin.official = (/^pc-[a-zA-Z0-9]+$/).test(id);
      }
    });

    if (this.settings.get('autoupdates', true)) {
      this.utils.checkForUpdates();
    }

    this.state.initializedStore = true;
  }

  async patchSettingsContextMenu () {
    const { SubMenuItem, hiddenPlugins } = this.state;

    const SettingsContextMenu = (await getModuleByDisplayName('UserSettingsCogContextMenu'));
    inject('quickActions-SettingsContextMenu', SettingsContextMenu.prototype, 'render', (_, res) => {
      const items = [];

      powercord.api.settings.tabs.forEach(item => {
        items.push(item.section === 'pc-pluginManager'
          ? this.buildContentMenu(true)
          : this.buildSettingMenu(item.label, item.section));
      });

      const showHiddenPlugins = this.settings.get('showHiddenPlugins', false);
      if (powercord.pluginManager.isEnabled('pc-styleManager') && (showHiddenPlugins || !hiddenPlugins.includes('pc-styleManager'))) {
        const pluginsMenu = items.find(item => item.props.label === 'Plugins');
        if (pluginsMenu) {
          items.splice(items.indexOf(pluginsMenu) + 1, 0, this.buildContentMenu());
        } else {
          items.splice(1, 0, this.buildContentMenu());
        }
      }

      items.push(this.buildSettingMenu('⭐ Quick Actions', this.pluginID));

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
    const { hiddenPlugins } = this.state;

    const id_ = id;
    const items = [];
    const plugin = this.settingsStore.get('plugins')[id];
    if (plugin) {
      id = plugin.id ? plugin.id : id;

      const showHiddenPlugins = this.settings.get('showHiddenPlugins', false);
      if (!showHiddenPlugins && hiddenPlugins.includes(id)) {
        return null;
      } else if (typeof plugin.hide === 'function') {
        const hidePlugin = plugin.hide();
        if (hidePlugin) {
          return null;
        }
      } else if (plugin.hide) {
        return null;
      }

      for (const key in plugin.settings) {
        const setting = plugin.settings[key];
        if (setting) {
          let item;

          if (typeof setting.hide === 'function') {
            const hideSetting = setting.hide.bind(this, id)();
            if (hideSetting) {
              continue;
            }
          } else if (setting.hide) {
            continue;
          }

          switch (setting.type) {
            case 'button':
              item = require('./core/types/button').bind(this, id, key, setting, name)(this);

              break;
            case 'submenu':
              item = require('./core/types/submenu').bind(this, id, key, plugin, setting, name)(this);

              break;
            case 'slider':
              item = require('./core/types/slider').bind(this, id, key, setting)(this);

              break;
            default:
              item = require('./core/types/checkbox').bind(this, id, key, setting)(this);
          }

          Object.keys(item.props).forEach(key => !item.props[key] ? delete item.props[key] : '');

          items.push(item);
        }
      }
    }

    const props = {
      label: name,
      seperated: id === this.pluginID,
      action: () => id !== this.pluginID ? this.utils.showCategory(id_) : null
    };

    if (items.length > 0) {
      return React.createElement(require('./core/components/ContextMenu/SubMenuItem'), {
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
    const { SubMenuItem, communityRepos } = this.state;
    const { plugins, hiddenPlugins, disabledPlugins } = this.utils.getPlugins();
    const { themes, disabledThemes } = this.utils.getThemes();

    const items = [];
    const submenu = React.createElement(SubMenuItem, {
      label: checkForPlugins ? 'Plugins' : 'Themes',
      invertChildY: true,
      render: items,
      action: () => checkForPlugins ? this.utils.showCategory('pc-pluginManager') : null
    });

    const children = [];
    const content = checkForPlugins ? plugins : themes;

    for (const key in content) {
      const id = content[key];
      const metadata = (checkForPlugins ? powercord.pluginManager : powercord.styleManager).get(id).manifest;
      const isContentDisabled = (checkForPlugins ? disabledPlugins : disabledThemes).includes(id);
      const props = {
        label: id,
        desc: `${metadata.name}${metadata.author !== 'Unknown' ? ` by ${metadata.author} ` : ' '}(v${metadata.version})`,
        seperated: children.length < 1
      };

      let child;

      if (checkForPlugins) {
        const enforcedPlugins = [ 'pc-settings', 'pc-pluginManager', 'pc-updater' ];

        child = React.createElement(require('./core/components/ContextMenu/SubMenuItem'), {
          ...props,
          invertChildY: true,
          render: [ !enforcedPlugins.includes(id)
            ? [ React.createElement(ToggleMenuItem, {
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
            }) ]
            : null, React.createElement(ImageMenuItem, {
            label: 'Reload Plugin',
            image: 'fa-sync',
            styles: { color: '#43b581' },
            seperated: true,
            action: async (state) => {
              const { image } = state;

              const loading = setInterval(() => {
                if (state.label.length > 11) {
                  state.label = 'Reloading';
                } else {
                  state.label += '.';
                }

                this.utils.forceUpdate();
              }, 250);

              state.disabled = true;
              state.image = 'fa-sync fa-spin';

              setTimeout(async () => {
                clearInterval(loading);

                await powercord.pluginManager.remount(id).then(() => {
                  state.label = 'Plugin Reloaded!';
                  state.image = image;
                  state.disabled = false;
                });

                if (!powercord.pluginManager.isEnabled(id)) {
                  powercord.pluginManager.unload(id);
                }

                this.utils.forceUpdate();
              }, 3e3);
            }
          }), !(/^pc-[a-zA-Z0-9]+$/).test(id)
            ? React.createElement(ImageMenuItem, {
              label: 'Uninstall Plugin',
              image: 'fa-trash-alt',
              danger: true,
              action: () => this.utils.showPluginModal(id, metadata, true)
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
    }), React.createElement(ImageMenuItem, {
      label: `Open ${checkForPlugins ? 'Plugins' : 'Themes'} Folder`,
      image: 'fa-folder-open',
      styles: { color: '#7289da' },
      seperated: true,
      action: () => this.utils.openFolder(`${checkForPlugins
        ? powercord.pluginManager.pluginDir
        : powercord.styleManager.themesDir}`)
    }));

    if (checkForPlugins) {
      if (this.settings.get('showExplorePlugins', true)) {
        items.splice(0, 0, React.createElement(SubMenuItem, {
          label: `Explore Plugins (${communityRepos.length})`,
          invertChildY: true,
          render: communityRepos
            .map(repo => React.createElement(require('./core/components/ContextMenu/SubMenuItem'), {
              label: repo.name,
              desc: repo.description,
              render: [ React.createElement(ImageMenuItem, {
                label: 'Open in GitHub',
                image: 'fa-github-brand',
                styles: { color: '#7289da' },
                action: () => require('electron').shell.openExternal(repo.svn_url)
              }), React.createElement(ImageMenuItem, {
                label: 'Install Plugin',
                image: 'fa-download',
                styles: { color: '#43b581' },
                seperated: true,
                action: () => this.utils.showPluginModal(repo.name, repo)
              }) ]
            }))
        }));
      }

      children.splice(0, 0, React.createElement(ToggleMenuItem, {
        label: 'Show Hidden Plugins',
        active: this.settings.get('showHiddenPlugins', false),
        action: (state) => ((this.settings.set('showHiddenPlugins', state), this.utils.forceUpdate()))
      }));
    }

    return submenu;
  }
}

module.exports = QuickActionsR;
