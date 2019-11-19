const { React, contextMenu, getModule, constants: Constants } = require('powercord/webpack');
const { forceUpdateElement, getOwnerInstance, waitFor } = require('powercord/util');
const { open: openModal, close: closeModal } = require('powercord/modal');
const { get } = require('powercord/http');
const { exec, spawn } = require('child_process');
const { actions: { updateSetting } } = powercord.api.settings;

module.exports = (plugin = null) => {
  const { settings, state, manifest: { version } } = plugin;
  const { communityRepos, communityThemes, unofficialPlugins } = state;

  return ({
    getPlugins () {
      const disabledPlugins = powercord.settings.get('disabledPlugins', []);
      const hiddenPlugins = powercord.settings.get('hiddenPlugins', []);
      const plugins = [ ...powercord.pluginManager.plugins.keys() ]
        .filter(pluginId => !settings.get('showHiddenPlugins', false)
          ? pluginId !== plugin.entityID && !hiddenPlugins.includes(pluginId)
          : pluginId !== plugin.entityID)
        .sort((a, b) => {
          const filter = a < b
            ? -1
            : 1 || 0;

          return filter;
        });

      return { disabledPlugins,
        hiddenPlugins,
        plugins };
    },

    getNormalizedPlugins () {
      const plugins = [ ...powercord.pluginManager.plugins.keys() ]
        .map(pluginId => this.normalizeToCleanText(pluginId));

      return plugins;
    },

    async getUnofficialPlugins () {
      if (unofficialPlugins.length === 0) {
        plugin.debug('Requesting unofficial plug-ins from host...');

        const plugins = await get(`https://api.griefmodz.xyz/plugins/?v=${version}`).then(res =>
          res.body);

        state.unofficialPlugins = await plugins.map(plugin => {
          delete plugin._id;

          return plugin;
        });

        plugin.debug(`Found '${plugins.length}' unofficial plug-ins!`, [ plugins ]);
      }
    },

    async getCommunityRepos () {
      if (communityRepos.length === 0) {
        const repos = await get('https://api.github.com/users/powercord-community/repos')
          .then(res => res.body);

        state.communityRepos = await Promise.all(await repos
          .filter(repo => !repo.archived && repo.license)
          .map(async repo => {
            const manifest = await fetch(`https://raw.githubusercontent.com/powercord-community/${repo.name}/master/manifest.json`)
              .then(res => res.json());

            return ({
              id: repo.name,
              name: manifest.name,
              version: manifest.version,
              description: repo.description.includes('Developer: @')
                ? repo.description.substring(0, repo.description.indexOf('Developer: @'))
                : repo.description,
              author: repo.description.split('Developer: @')[1] || manifest.author,
              license: repo.license ? repo.license.spdx_id : 'UNLICENCED',
              repo: repo.html_url,
              verified: true
            });
          })
        );
      }
    },

    async getCommunityThemes () {
      if (communityThemes.length === 0) {
        plugin.debug('Requesting community themes from host...');

        const themes = await get(`https://api.griefmodz.xyz/themes/?v=${version}`).then(res =>
          res.body);

        state.communityThemes = await themes.map(theme => {
          delete theme._id;

          return theme;
        });

        plugin.debug(`Found '${themes.length}' community themes!`, [ themes ]);
      }
    },

    getThemes () {
      const disabledThemes = powercord.settings.get('disabledThemes', []);
      const themes = [ ...powercord.styleManager.themes.keys() ]
        .filter(themeId => themeId !== 'powercord-core' && !powercord.pluginManager.plugins.has(themeId) &&
          !themeId.startsWith('discord-tweaks'))
        .sort((a, b) => {
          const filter = a < b
            ? -1
            : 1 || 0;

          return filter;
        });

      return { disabledThemes,
        themes };
    },

    async uninstallContent (contentType, contentId) {
      const { existsSync, promises: { lstat, readdir, rmdir, unlink } } = require('fs');
      const { pluginManager, styleManager } = powercord;

      const contentManager = contentType === 'theme' ? styleManager : pluginManager;
      contentManager.contentDir = contentType === 'theme' ? contentManager.themesDir : contentManager.pluginDir;

      const rmdirRf = async (path) => {
        if (existsSync(path)) {
          const files = await readdir(path);

          await Promise.all(files.map(async (file) => {
            const currentPath = `${path}/${file}`;
            const stat = await lstat(currentPath);

            if (stat.isDirectory()) {
              await rmdirRf(currentPath);
            } else {
              await unlink(currentPath);
            }
          }));

          await rmdir(path);
        }
      };

      const contentName = contentManager.get(contentId).manifest.name;

      await contentManager.unmount(contentId);
      await rmdirRf(require('path').resolve(contentManager.contentDir, contentId));

      powercord.api.notices.sendToast('quickActions-content-uninstalled', {
        type: 'success',
        header: `Good news! "${contentName}" was successfully uninstalled!`,
        content: `Nothing else is required from you as we've already gone ahead and have unloaded the ${contentType}.`,
        buttons: [ {
          text: 'OK',
          color: 'green',
          look: 'outlined'
        } ],
        timeout: 3e4
      });
    },

    async installContent (contentType, contentId, cloneUrl) {
      const { pluginManager, styleManager } = powercord;
      const contentManager = contentType === 'theme' ? styleManager : pluginManager;
      contentManager.contentDir = contentType === 'theme' ? contentManager.themesDir : contentManager.pluginDir;

      powercord.api.notices.sendToast('quickActions-content-installing', {
        header: `"${contentId}" is now installing in the background; we'll let you know once it's done.`,
        timeout: 3e4
      });

      await require('util').promisify(exec)(`git clone ${cloneUrl}`, { cwd: contentManager.contentDir })
        .then(async () => {
          if (contentType === 'theme') {
            await contentManager.loadThemes();
          } else {
            contentManager.mount(contentId);
            contentManager.load(contentId);
          }

          const content = contentManager.get(contentId.toLowerCase());
          const pluginSettingsButton = {
            text: 'Open Plugin Settings',
            color: 'brand',
            look: 'outlined',
            onClick: () => this.showCategory(content.registered.settings[0])
          };

          powercord.api.notices.closeToast('quickActions-content-installing');

          setTimeout(() => {
            powercord.api.notices.sendToast('quickActions-content-installed', {
              type: 'success',
              header: `Good news! "${content.manifest.name}" was successfully installed!`,
              content: `Nothing else is required from you as we've already gone ahead and have loaded the ${contentType}.`,
              buttons: [ content.registered && powercord.api.settings.tabs.find(tab => tab.section === content.registered.settings[0])
                ? pluginSettingsButton
                : null, {
                text: 'OK',
                color: 'green',
                look: 'outlined'
              } ],
              timeout: 3e4
            });
          }, 500);
        });
    },

    togglePlugin (pluginId) {
      return !powercord.pluginManager.isEnabled(pluginId)
        ? powercord.pluginManager.enable(pluginId)
        : powercord.pluginManager.disable(pluginId);
    },

    toggleTheme (themeId) {
      contextMenu.closeContextMenu();

      return !powercord.styleManager.isEnabled(themeId)
        ? powercord.styleManager.enable(themeId)
        : powercord.styleManager.disable(themeId);
    },

    toggleButtonMode (pluginId, settingKey, setting) {
      const mode = powercord.api.settings.store.getSetting(pluginId, settingKey, setting.default);
      const value = mode === setting.default
        ? setting.newValue
        : setting.default;

      updateSetting(pluginId, settingKey, value);

      this.forceUpdate();
    },

    handleGuildToggle (guildId) {
      const hiddenGuilds = powercord.api.settings.store.getSetting('pc-emojiUtility', 'hiddenGuilds', []);
      return updateSetting('pc-emojiUtility', 'hiddenGuilds', !hiddenGuilds.includes(guildId)
        ? [ ...hiddenGuilds, guildId ]
        : hiddenGuilds.filter(guild => guild !== guildId));
    },

    openFolder (dir) {
      const cmds = {
        win32: 'explorer',
        darwin: 'open',
        linux: 'xdg-open'
      };

      spawn(cmds[process.platform], [ dir ]);
    },

    normalizeToCleanText (str) {
      return str.toLowerCase().replace(/pc-|powercord-|-|_|/g, '');
    },

    insertAtCaret (elem, text) {
      const caretPos = elem.selectionStart;
      const textAreaText = elem.value;

      elem.value = textAreaText.substring(0, caretPos) + text + textAreaText.substring(caretPos);
    },

    async showCategory (sectionId) {
      contextMenu.closeContextMenu();

      const userSettingsWindow = (await getModule([ 'open', 'updateAccount' ]));
      userSettingsWindow.open();
      userSettingsWindow.setSection(sectionId);
    },

    async openUserSettings () {
      contextMenu.closeContextMenu();

      const userSettingsWindow = {
        open: (await getModule([ 'open', 'updateAccount' ])).open,
        getSection: (await getModule([ 'getSection', 'shouldOpenWithoutBackstack' ])).getSection,
        setSection: (await getModule([ 'open', 'updateAccount' ])).setSection
      };

      userSettingsWindow.open();

      if (!powercord.api.settings.tabs.find(tab => tab.section === userSettingsWindow.getSection())) {
        userSettingsWindow.setSection('pc-general');
      }
    },

    openModal (elem) {
      contextMenu.closeContextMenu();

      openModal(() => elem);
    },

    async forceUpdate () {
      const contextMenuClasses = (await getModule([ 'itemToggle', 'checkbox' ]));
      const contextMenuQuery = `.${contextMenuClasses.contextMenu.split(' ')[0]}`;

      if (document.querySelector(contextMenuQuery)) {
        forceUpdateElement(contextMenuQuery);

        const updater = getOwnerInstance(await waitFor(contextMenuQuery)).props.onHeightUpdate;
        if (typeof updater === 'function') {
          updater();
        }
      }
    },

    showRestartModal () {
      const GenericModal = require('./components/Modal');
      this.openModal(React.createElement(GenericModal, {
        red: true,
        header: 'Restart Discord',
        confirmText: 'Restart',
        cancelText: 'Postpone',
        desc: 'This setting requires you to restart Discord to take effect. Do you want to restart Discord now?',
        onConfirm: () => window.reloadElectronApp(),
        onCancel: () => closeModal()
      }));
    },

    showContentModal (contentId, metadata, uninstall) {
      const GenericModal = require('./components/Modal');
      this.openModal(React.createElement(GenericModal, {
        red: uninstall,
        header: `${uninstall ? 'Uninstall' : 'Install'} '${metadata.name}'`,
        confirmText: `${uninstall ? 'Uninstall' : 'Install'} ${metadata.theme ? 'Theme' : 'Plugin'}`,
        cancelText: 'Cancel',
        desc: `Are you sure you want to ${uninstall ? 'uninstall' : 'install'} this ${metadata.theme ? 'theme' : 'plug-in'}?`,
        onConfirm: () => ((uninstall
          ? this.uninstallContent(metadata.theme ? 'theme' : 'plugin', contentId)
          : this.installContent(metadata.theme ? 'theme' : 'plugin', contentId, `${metadata.repo}.git`),
        closeModal())),
        onCancel: () => closeModal(),
        contentInfo: metadata
      }));
    },

    showSettingModal (opts) {
      const SettingModal = require('./components/SettingModal');
      this.openModal(React.createElement(SettingModal, {
        onConfirm: (value) => {
          updateSetting(opts.id, opts.key, value);

          if (typeof opts.setting.func !== 'undefined') {
            if (opts.setting.func.method && opts.setting.func.type === 'pluginManager') {
              powercord.pluginManager.get(opts.id)[opts.setting.func.method]();
            }
          }
        },
        main: plugin,
        options: opts
      }));
    },

    showPassphraseModal (opts) {
      const GenericModal = require('./components/Modal');
      this.openModal(React.createElement(GenericModal, {
        red: false,
        header: 'Update passphrase',
        confirmText: 'Update',
        cancelText: 'Cancel',
        input: [
          {
            title: 'Passphrase',
            text: powercord.api.settings.store.getSetting('pc-general', 'passphrase'),
            type: 'password',
            icon: {
              name: 'Eye',
              tooltip: 'Show Password'
            }
          }
        ],
        button: {
          resetToDefault: true
        },
        onConfirm: (value) => {
          if (value !== '') {
            updateSetting('pc-general', 'passphrase', value);
          }

          closeModal();
        },
        onCancel: () => {
          if (opts.cancel) {
            updateSetting('pc-general', 'settingsSync', false);
          }

          closeModal();
        },
        options: opts
      }));
    },

    getDefaultColors () {
      return Constants.ROLE_COLORS;
    }
  });
};
