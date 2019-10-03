const { React, contextMenu, getModule, constants: Constants } = require('powercord/webpack');
const { forceUpdateElement, getOwnerInstance } = require('powercord/util');
const { open: openModal, close: closeModal } = require('powercord/modal');
const { get } = require('powercord/http');
const { exec, spawn } = require('child_process');
const { actions: { updateSetting } } = powercord.api.settings;

const announcements = powercord.pluginManager.get('pc-announcements');

module.exports = (plugin = null) => ({
  getPlugins () {
    const disabledPlugins = powercord.settings.get('disabledPlugins', []);
    const hiddenPlugins = powercord.settings.get('hiddenPlugins', []);
    const plugins = [ ...powercord.pluginManager.plugins.keys() ]
      .filter(pluginId => !plugin.settings.get('showHiddenPlugins', false)
        ? pluginId !== plugin.pluginID && !hiddenPlugins.includes(pluginId)
        : pluginId !== plugin.pluginID)
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
    if (plugin.state.unofficialPlugins.length === 0) {
      const plugins = await get('https://api.griefmodz.xyz/plugins').then(res =>
        res.body);

      plugin.state.unofficialPlugins = await plugins.map(plugin => {
        delete plugin._id;

        return plugin;
      });
    }
  },

  async getCommunityRepos () {
    if (plugin.state.communityRepos.length === 0) {
      const communityRepos = await get('https://api.github.com/users/powercord-community/repos')
        .then(res => res.body);

      plugin.state.communityRepos = await Promise.all(await communityRepos
        .filter(repo => !repo.archived && repo.name !== 'guidelines')
        .map(async repo => {
          const manifest = await get(`https://raw.githubusercontent.com/powercord-community/${repo.name}/master/manifest.json`)
            .then(res => JSON.parse(res.body));

          return ({
            id: repo.name,
            name: manifest.name,
            version: manifest.version,
            description: repo.description.includes('Developer: @')
              ? repo.description.substring(0, repo.description.indexOf('Developer: @'))
              : repo.description,
            author: repo.description.split('Developer: @')[1] || manifest.author,
            license: repo.license ? repo.license.spdx_id : 'UNLICENCED',
            repo: repo.html_url
          });
        })
      );
    }
  },

  async getCommunityThemes () {
    if (plugin.state.communityThemes.length === 0) {
      const themes = await get('https://api.griefmodz.xyz/themes').then(res =>
        res.body);

      plugin.state.communityThemes = await themes.map(theme => {
        delete theme._id;

        return theme;
      });
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

    if (announcements) {
      announcements.sendNotice({
        id: 'quickActions-content-uninstalled',
        type: announcements.Notice.TYPES.ORANGE,
        message: `Good news! "${contentName}" was successfully uninstalled; nothing is required from you as we've already gone ahead and unloaded the ${contentType}.`,
        alwaysDisplay: true
      });

      return setTimeout(() => announcements.closeNotice('quickActions-content-uninstalled'), 3e4);
    }
  },

  async installContent (contentType, contentId, cloneUrl) {
    const { pluginManager, styleManager } = powercord;
    const contentManager = contentType === 'theme' ? styleManager : pluginManager;
    contentManager.contentDir = contentType === 'theme' ? contentManager.themesDir : contentManager.pluginDir;

    announcements.sendNotice({
      id: 'quickActions-content-installing',
      type: announcements.Notice.TYPES.BLURPLE,
      message: `As requested "${contentId}" is installing in the background; we'll let you know once it's done.`,
      alwaysDisplay: true
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
          onClick: () => {
            announcements.closeNotice('quickActions-content-installed');

            this.showCategory(content.registered.settings[0]);
          }
        };

        if (announcements) {
          announcements.closeNotice('quickActions-content-installing');
          announcements.sendNotice({
            id: 'quickActions-content-installed',
            type: announcements.Notice.TYPES.GREEN,
            message: `Good news! "${content.manifest.name}" was successfully installed; nothing is required from you as we've already gone ahead and loaded the ${contentType}.`,
            button: content.registered && powercord.api.settings.tabs.find(tab => tab.section === content.registered.settings[0]) ? pluginSettingsButton : null,
            alwaysDisplay: true
          });

          return setTimeout(() => announcements.closeNotice('quickActions-content-installed'), 3e4);
        }
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

  async forceUpdate (updateAll = false, updateHeight) {
    const contextMenuClasses = (await getModule([ 'itemToggle', 'checkbox' ]));
    const contextMenuQuery = `.${contextMenuClasses.contextMenu.replace(/ /g, '.')}`;

    if (document.querySelector(contextMenuQuery)) {
      forceUpdateElement(contextMenuQuery, updateAll);

      if (updateHeight) {
        for (const elem of document.querySelectorAll(contextMenuQuery)) {
          const updater = getOwnerInstance(elem).props.onHeightUpdate;
          if (typeof updater === 'function') {
            updater();
          }
        }
      }
    }
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
      plugin,
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
  },

  async checkForUpdates () {
    if (announcements.settings.get('dismissed', []).includes('quickActions-pending-update')) {
      return plugin.settings.set('autoupdates', false);
    }

    const hostUrl = 'https://api.griefmodz.xyz';
    const manifestUrl = `${hostUrl}/github/GriefMoDz/quickActions/master/manifest.json`;

    const { version: latestVersion } = await get(manifestUrl)
      .then(res => res.body);

    if (plugin.manifest.version < latestVersion && announcements) {
      const currentUser = (await getModule([ 'getCurrentUser' ])).getCurrentUser();

      announcements.sendNotice({
        id: 'quickActions-pending-update',
        type: announcements.Notice.TYPES.BLURPLE,
        message: `G'day, ${currentUser.username}! We've noticed that you're running an older instance of "Quick Actions". ` +
          'You should consider updating to the latest build so that you don\'t miss out on any important updates or newly added features! 😊',
        button: {
          text: 'Update Now',
          onClick: async () => {
            announcements.closeNotice('quickActions-pending-update');

            const { pluginDir } = powercord.pluginManager;
            const { join } = require('path');

            try {
              if (require('fs').promises.stat(join(pluginDir, `${plugin.pluginID}/.git`))) {
                await require('util').promisify(exec)(
                  'git pull --ff-only --verbose', { cwd: join(pluginDir, plugin.pluginID) }
                ).catch(err => plugin.error(err)).then(async res => {
                  if (res.stdout.includes('\nFast-forward\n')) {
                    announcements.sendNotice({
                      id: 'quickActions-successful-update',
                      type: announcements.Notice.TYPES.GREEN,
                      message: `Quick Actions was successfully updated to the latest build (v${latestVersion}) - remounting plug-in! Sit tight...`,
                      alwaysDisplay: true
                    });

                    setTimeout(async () => powercord.pluginManager.remount(plugin.pluginID).then(
                      () => announcements.closeNotice('quickActions-successful-update')
                    ), 10e3);
                  }
                });
              }
            } catch (_) {
              announcements.sendNotice({
                id: 'quickActions-failed-update',
                type: announcements.Notice.TYPES.RED,
                message: 'Oops! It seems you\'ve downloaded "Quick Actions" from GitHub. You should instead clone the repo to open yourself up to auto-updates.',
                alwaysDisplay: true
              });
            }
          }
        },
        alwaysDisplay: plugin.settings.get('autoupdates') ? true : ''
      });

      return { updateAvailable: true };
    }
  }
});
