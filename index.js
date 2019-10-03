// loosely based on and inspired by https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/BDContextMenu/BDContextMenu.plugin.js

const { Plugin } = require('powercord/entities');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { getOwnerInstance, waitFor } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');
const { ItemGroup, ImageMenuItem, MenuItem, SubMenuItem, ToggleMenuItem } = require('./core/components/ContextMenu');

class QuickActionsR extends Plugin {
  constructor (props) {
    super(props);

    this.state = {
      initializedStore: false,
      settings: require('./core/store/settings')(this),
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

    if (!this.state.initializedStore) {
      this.initializeStore();
    }

    await this.utils.getUnofficialPlugins();
    await this.utils.getCommunityThemes();
    await this.utils.getCommunityRepos();

    this.state.emojiStore = (await getModule([ 'getGuildEmoji' ]));
    this.state.sortedGuildsStore = (await getModule([ 'getSortedGuilds' ]));
    this.state.SubMenuItem = (await getModuleByDisplayName('FluxContainer(SubMenuItem)'));

    this.patchSettingsContextMenu();
  }

  pluginWillUnload () {
    uninject('quickActions-SubMenuItem-postRender');
    uninject('quickActions-SettingsContextMenu');
    uninject('quickActions-SubMenuItem-icon');
    uninject('quickActions-SubMenuItem-render');

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

    inject('quickActions-SubMenuItem-postRender', SubMenuItem.prototype, 'render', (_, res) => {
      this.patchSubMenuItem(res.type.prototype);

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

      items.push(this.buildSettingMenu('⭐ Quick Actions', this.pluginID));

      const parent = React.createElement(this.state.SubMenuItem, {
        label: 'Powercord',
        render: items,
        action: () => this.utils.openUserSettings()
      });

      res.props.className += ' quickActions-contextMenu';
      res.props.children.splice(0, 0, React.createElement(ItemGroup, { children: [ parent ] }));

      return res;
    });

    this.utils.forceUpdate();

    getOwnerInstance(await waitFor('.quickActions-contextMenu')).forceUpdate();
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
      seperated: id === this.pluginID,
      action: () => id !== this.pluginID ? this.utils.showCategory(id_) : null
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

  async patchSubMenuItem (component) {
    const { itemImage, image } = (await getModule([ 'itemToggle', 'checkbox' ]));

    uninject('quickActions-SubMenuItem-icon');
    inject('quickActions-SubMenuItem-icon', component, 'render', function (_, res) {
      if (this.props.label === 'Powercord') {
        res.props.children.splice(1, 0, React.createElement('img', {
          alt: '',
          src: 'data:image/png;base64,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',
          className: `quickActions-contextMenu-icon ${image}`
        }));

        res.props.className += ` ${itemImage} quickActions-contextMenu-submenu`;
      }

      return res;
    });

    this.patchSubMenuItemRender();
  }

  async patchSubMenuItemRender () {
    const layer = `.${(await getModule([ 'layerContainer' ])).layer.replace(/ /g, '.')}`;
    const subMenuQuery = await waitFor('.quickActions-contextMenu-submenu');
    const instance = getOwnerInstance(subMenuQuery);

    uninject('quickActions-SubMenuItem-render');
    inject('quickActions-SubMenuItem-render', instance, 'render', (_, res) => {
      if (document.querySelector(layer)) {
        const instance = getOwnerInstance(document.querySelector(layer));
        if (instance.containerInfo.children && instance.containerInfo.children[1]) {
          const layer = instance.containerInfo.children[1];
          const subContextMenu = layer.firstChild;
          const scroller = subContextMenu.firstChild.firstChild;

          if (instance.containerInfo.children[1].innerText.includes('⭐ Quick Actions')) {
            layer.style.top = `${instance.containerInfo.children[0].getBoundingClientRect().top}px`;
            scroller.style.maxHeight = '386.5px';
          }
        }
      }

      return res;
    });

    instance.forceUpdate();
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
            image: 'fa-sync',
            styles: { color: '#43b581' },
            seperated: true,
            disabled: this.state.reloading[id],
            action: async (component) => {
              const { state: { props } } = component;
              const { label, image } = props;

              const loading = setInterval(() => {
                if (props.label.length > 11) {
                  props.label = 'Reloading';
                } else {
                  props.label += '.';
                }

                this.utils.forceUpdate();
              }, 250);

              this.state.reloading[id] = true;

              props.image = 'fa-sync fa-spin';

              setTimeout(async () => {
                clearInterval(loading);

                await powercord.pluginManager.remount(id).then(() => {
                  delete this.state.reloading[id];

                  props.label = 'Plugin Reloaded!';
                  props.image = image;

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
              image: 'fa-trash-alt',
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
            image: 'fa-trash-alt',
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
      image: 'fa-folder-open',
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
              image: `fa-${content.repo.startsWith('https://gitlab.com/') ? 'gitlab' : 'github'}-brand`,
                styles: { color: '#7289da' },
              action: () => require('electron').shell.openExternal(content.repo)
              }), React.createElement(ImageMenuItem, {
              label: `Install ${checkForPlugins ? 'Plugin' : 'Theme'}`,
                image: 'fa-download',
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
