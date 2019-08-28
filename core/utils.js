const { React, contextMenu, getModule } = require('powercord/webpack');
const { forceUpdateElement, getOwnerInstance } = require('powercord/util');
const { open: openModal, close: closeModal } = require('powercord/modal');
const { get } = require('powercord/http');
const { exec, spawn } = require('child_process');
const { actions: { updateSetting } } = powercord.api.settings;

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

  async getCommunityRepos () {
    if (plugin.state.communityRepos.length === 0) {
      const communityRepos = await get('https://api.github.com/users/powercord-community/repos').then(res =>
        res.body);

      plugin.state.communityRepos = await communityRepos.filter(repo =>
        repo.name !== 'guidelines' && !powercord.pluginManager.plugins.has(repo.name)
      );
    }
  },

  getThemes () {
    const disabledThemes = powercord.settings.get('disabledThemes', []);
    const themes = [ ...powercord.styleManager.themes.keys() ]
      .filter(themeId => themeId !== 'powercord-core' && !powercord.pluginManager.plugins.has(themeId))
      .sort((a, b) => {
        const filter = a < b
          ? -1
          : 1 || 0;

        return filter;
      });

    return { disabledThemes,
      themes };
  },

  async uninstallPlugin (pluginId) {
    const { existsSync, promises: { lstat, readdir, rmdir, unlink } } = require('fs');
    const { pluginManager } = powercord;

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

    await pluginManager.unmount(pluginId);
    await rmdirRf(require('path').resolve(pluginManager.pluginDir, pluginId));
  },

  async installPlugin (pluginId, cloneUrl) {
    const { pluginManager } = powercord;

    await require('util').promisify(exec)(`git clone ${cloneUrl}`, { cwd: pluginManager.pluginDir })
      .then(() => pluginManager.mount(pluginId));
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

  async forceUpdate (updateAll = true, updateHeight) {
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

  showPluginModal (pluginId, metadata, uninstall) {
    const GenericModal = require('./components/Modal');
    this.openModal(React.createElement(GenericModal, {
      red: uninstall,
      header: `${uninstall ? 'Uninstall' : 'Install'} '${metadata.name}'`,
      confirmText: `${uninstall ? 'Uninstall' : 'Install'} Plugin`,
      cancelText: 'Cancel',
      desc: `Are you sure you want to ${uninstall ? 'uninstall' : 'install'} <b>${metadata.name}</b> (${pluginId})?`,
      onConfirm: () => ((uninstall ? this.uninstallPlugin(pluginId) : this.installPlugin(pluginId, metadata.clone_url), closeModal())),
      onCancel: () => closeModal()
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
    return [ '1752220', '3066993', '3447003', '10181046', '15277667', '15844367', '15105570',
      '15158332', '9807270', '6323595', '1146986', '2067276', '2123412', '7419530', '11342935',
      '12745742', '11027200', '10038562', '9936031', '5533306' ];
  },

  async checkForUpdates () {
    const announcements = powercord.pluginManager.get('pc-announcements');
    if (announcements.settings.get('dismissed', []).includes('quickActions-pending-update')) {
      return plugin.settings.set('autoupdates', false);
    }

    const lastCommitHash = await get('https://api.github.com/repos/GriefMoDz/quickActions/commits/master')
      .then(res => res.body.sha);

    const hostUrl = 'https://rawcdn.githack.com';
    const manifestUrl = `${hostUrl}/GriefMoDz/quickActions/${lastCommitHash}/manifest.json`;

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
    }
  }
});
