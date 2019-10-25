// loosely based on and inspired by https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/BDContextMenu/BDContextMenu.plugin.js
const { Plugin } = require('powercord/entities');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { getOwnerInstance, waitFor } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');
const { ImageMenuItem, MenuItem, SubMenuItem, ToggleMenuItem } = require('./core/components/ContextMenu');
const { Icons: { Powercord } } = require('./core/components');

class QuickActionsR extends Plugin {
  constructor (props) {
    super(props);

    this.state = {
      reloading: [],
      communityPlugins: [],
      unofficialPlugins: [],
      communityThemes: [],
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

    if (!powercord.pluginManager.get(this.entityID).store) {
      this.initializeStore();
    }

    this.classes = {
      ...await getModule([ 'app' ]),
      ...await getModule([ 'chat', 'noChannel' ])
    };

    this.stores = {};
    this.stores.emojiStore = (await getModule([ 'getGuildEmoji' ]));
    this.stores.sortedGuildsStore = (await getModule([ 'getSortedGuilds' ]));

    await this.utils.getUnofficialPlugins();
    await this.utils.getCommunityThemes();
    await this.utils.getCommunityRepos();

    this.patchSettingsContextMenu();
  }

  pluginWillUnload () {
    uninject('quickActions-SettingsContextMenu');
    uninject('quickActions-SubMenuItem-icon');

    this.utils.forceUpdate();
  }

  initializeStore () {
    const settings = require('./core/store/settings')(this);
    settings.forEach(plugins => {
      this.settingsStore.set('plugins', plugins);
    });

    Object.keys(this.store.get('plugins')).forEach(id => {
      const plugin = this.store.get('plugins')[id];
      if (typeof plugin.official === 'undefined') {
        plugin.official = (/^pc-[a-zA-Z0-9]+$/).test(id);
      }
    });
  }

  async patchSettingsContextMenu () {
    const { hiddenPlugins } = this.state;
    const { image } = (await getModule([ 'itemToggle', 'checkbox' ]));

    inject('quickActions-SubMenuItem-icon', SubMenuItem.prototype, 'render', function (_, res) {
      if (this.props.label === 'Powercord') {
        res.props.children.props.children.splice(1, 0, React.createElement(Powercord, {
          className: `quickActions-contextMenu-icon ${image}`
        }));
      }

      return res;
    });

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

      items.push(this.buildSettingMenu('⭐ Quick Actions', this.entityID));

      const parent = React.createElement(SubMenuItem, {
        label: 'Powercord',
        render: items,
        action: () => this.utils.openUserSettings()
      });

      res.props.className += 'userSettingsContextMenu';

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

    const contextMenu = getOwnerInstance(await waitFor('.userSettingsContextMenu'));
    contextMenu.forceUpdate();
  }

  buildSettingMenu (name, id) {
    const id_ = id;
    const items = [];
    const plugin = this.settingsStore.get('plugins')[id];
    if (plugin) {
      id = plugin.id ? plugin.id : id;

      if (typeof plugin.hide === 'function') {
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

          if (typeof setting.hide === 'function'
            ? setting.hide.bind(this, id)()
            : setting.hide
          ) {
            continue;
          }

          Object.keys(item.props).forEach(key => !item.props[key] ? delete item.props[key] : '');

          items.push(item);
        }
      }
    }

    const showHiddenPlugins = this.settings.get('showHiddenPlugins', false);
    const hiddenPlugins = this.state.hiddenPlugins.map(hiddenPlugin => this.utils.normalizeToCleanText(hiddenPlugin));
    if (!showHiddenPlugins && hiddenPlugins.includes(this.utils.normalizeToCleanText(id))) {
      return null;
    }

    const props = {
      label: name,
      seperated: id === this.entityID,
      action: () => id !== this.entityID ? this.utils.showCategory(id_) : null
    };

    if (items.length > 0) {
      return React.createElement(require('./core/components/ContextMenu/SubMenuItem'), {
        ...props,
        render: items
      });
    }

    return React.createElement(MenuItem, {
      ...props
    });
  }

  buildContentMenu (checkForPlugins) {
    const { plugins, hiddenPlugins, disabledPlugins } = this.utils.getPlugins();
    const { themes, disabledThemes } = this.utils.getThemes();

    const items = [];
    const submenu = React.createElement(SubMenuItem, {
      label: checkForPlugins ? 'Plugins' : 'Themes',
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
        desc: `${metadata.name}${metadata.author !== 'Unknown' ? ` by ${metadata.author} ` : ' '}(v${metadata.version})`
      };

      let child;

      if (checkForPlugins) {
        const enforcedPlugins = [ 'pc-settings', 'pc-pluginManager', 'pc-updater' ];

        child = React.createElement(SubMenuItem, {
          ...props,
          seperated: children.length < 1,
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
          }), !enforcedPlugins.includes(id)
            ? React.createElement(ToggleMenuItem, {
              label: 'Enabled',
              active: !isContentDisabled,
              action: () => ((this.utils.togglePlugin(id), this.utils.forceUpdate()))
            })
            : null, React.createElement(ImageMenuItem, {
            label: 'Reload Plugin',
            icon: 'sync-alt-duotone',
            styles: { color: '#43b581' },
            seperated: true,
            disabled: this.state.reloading[id],
            action: async (component) => {
              const { state: { props } } = component;
              const { label, icon } = props;

              const loading = setInterval(() => {
                if (props.label.length > 11) {
                  props.label = 'Reloading';
                } else {
                  props.label += '.';
                }

                this.utils.forceUpdate();
              }, 250);

              this.state.reloading[id] = true;

              props.icon = 'sync-alt-duotone fa-spin';

              setTimeout(async () => {
                clearInterval(loading);

                await powercord.pluginManager.remount(id).then(() => {
                  delete this.state.reloading[id];

                  props.label = 'Plugin Reloaded!';
                  props.icon = icon;

                  setTimeout(() => {
                    props.label = label;

                    this.utils.forceUpdate();
                  }, 5e3);
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
              icon: 'trash-alt-duotone',
              danger: true,
              action: () => this.utils.showContentModal(id, metadata, true)
            })
            : null ]
        });
      } else {
        child = React.createElement(SubMenuItem, {
          ...props,
          render: [ React.createElement(ToggleMenuItem, {
            label: 'Enabled',
            active: !isContentDisabled,
            action: () => this.utils.toggleTheme(id)
          }), React.createElement(ImageMenuItem, {
            label: 'Uninstall Theme',
            icon: 'trash-alt-duotone',
            danger: true,
            seperated: true,
            action: () => this.utils.showContentModal(id, metadata, true)
          }) ]
        });
      }

      children.push(child);
    }

    items.push(React.createElement(SubMenuItem, {
      label: `Installed ${checkForPlugins ? 'Plugins' : 'Themes'} (${children.length})`,
      render: children
    }), React.createElement(ImageMenuItem, {
      label: `Open ${checkForPlugins ? 'Plugins' : 'Themes'} Folder`,
      icon: 'folder-open-duotone',
      styles: { color: '#7289da' },
      seperated: true,
      action: () => this.utils.openFolder(`${checkForPlugins
        ? powercord.pluginManager.pluginDir
        : powercord.styleManager.themesDir}`)
    }));

    if (checkForPlugins) {
      const communityPlugins = Array.from(new Set(this.state.communityRepos.concat(this.state.unofficialPlugins)));
      this.state.communityPlugins = communityPlugins.filter(plugin => !this.utils.getNormalizedPlugins()
        .find(pluginId => pluginId === this.utils.normalizeToCleanText(plugin.id)))
        .sort((a, b) => {
          const aName = (a.name).toLowerCase().replace(/ /g, '-');
          const bName = (b.name).toLowerCase().replace(/ /g, '-');

          const filter = aName < bName
            ? -1
            : 1 || 0;

          return filter;
        });

      children.splice(0, 0, React.createElement(ToggleMenuItem, {
        label: 'Show Hidden Plugins',
        active: this.settings.get('showHiddenPlugins', false),
        action: (state) => ((this.settings.set('showHiddenPlugins', state), this.utils.forceUpdate()))
      }));
    }

    const { communityPlugins } = this.state;
    const communityThemes = this.state.communityThemes.filter(theme => !powercord.styleManager.themes.has((theme.id).toLowerCase()))
      .sort((a, b) => {
        const aName = (a.name).toLowerCase().replace(/ /g, '-');
        const bName = (b.name).toLowerCase().replace(/ /g, '-');

        const filter = aName < bName
          ? -1
          : 1 || 0;

        return filter;
      });

    if (this.settings.get(`showExplore${checkForPlugins ? 'Plugins' : 'Themes'}`, true)) {
      items.splice(0, 0, React.createElement(SubMenuItem, {
        label: `Explore ${checkForPlugins ? `Plugins (${communityPlugins.length})` : `Themes (${communityThemes.length})`}`,
        render: (checkForPlugins ? communityPlugins : communityThemes)
          .map(content => React.createElement(SubMenuItem, {
            label: content.name.toLowerCase().replace(/ /g, '-'),
            desc: content.description,
            render: [ React.createElement(ImageMenuItem, {
              label: `Open in ${content.repo.startsWith('https://gitlab.com/') ? 'GitLab' : 'GitHub'}`,
              icon: `${content.repo.startsWith('https://gitlab.com/') ? 'gitlab' : 'github'}-brands`,
              styles: { color: '#7289da' },
              action: () => require('electron').shell.openExternal(content.repo)
            }), React.createElement(ImageMenuItem, {
              label: `Install ${checkForPlugins ? 'Plugin' : 'Theme'}`,
              icon: 'download-duotone',
              styles: { color: '#43b581' },
              seperated: true,
              action: () => this.utils.showContentModal(content.id, content)
            }) ]
          }))
      }));
    }

    return submenu;
  }
}

module.exports = QuickActionsR;
