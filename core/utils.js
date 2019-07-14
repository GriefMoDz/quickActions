const { open: openModal, close: closeModal } = require('powercord/modal');
const { forceUpdateElement } = require('powercord/util');
const { React, contextMenu, getModule } = require('powercord/webpack');
const { spawn } = require('child_process');
const { actions: { updateSetting } } = powercord.api.settings;

module.exports = {
  getPlugins () {
    const disabledPlugins = powercord.settings.get('disabledPlugins', []);
    const plugins = [ ...powercord.pluginManager.plugins.keys() ]
      .filter(plugin => plugin !== 'quickActions')
      .sort((a, b) => {
        const filter = a < b
          ? -1
          : 1 || 0;

        return filter;
      });

    return { disabledPlugins,
      plugins };
  },

  getThemes () {
    const disabledThemes = powercord.settings.get('disabledThemes', []);
    const themes = [ ...powercord.styleManager.themes.keys() ]
      .filter(theme => theme !== 'powercord-core' && !powercord.pluginManager.plugins.has(theme))
      .sort((a, b) => {
        const filter = a < b
          ? -1
          : 1 || 0;

        return filter;
      });

    return { disabledThemes,
      themes };
  },

  togglePlugin (pluginId) {
    if (!powercord.pluginManager.isEnabled(pluginId)) {
      powercord.pluginManager.enable(pluginId);
    } else {
      powercord.pluginManager.disable(pluginId);
    }
  },

  toggleTheme (themeId) {
    contextMenu.closeContextMenu();

    if (!powercord.styleManager.isEnabled(themeId)) {
      powercord.styleManager.enable(themeId);
    } else {
      powercord.styleManager.disable(themeId);
    }
  },

  toggleButtonMode(pluginId, settingKey, setting) {
    const mode = powercord.api.settings.store.getSetting(pluginId, settingKey, setting.default);
    const value = mode === setting.default
      ? setting.newValue
      : setting.default;

    updateSetting(pluginId, settingKey, value);

    if (pluginId === 'auditory') {
      powercord.pluginManager.get(pluginId).reload();
    }

    this.forceUpdate();
  },

  handleGuildToggle (id, guildId) {
    const hiddenGuilds = powercord.api.settings.store.getSetting(id, 'hiddenGuilds', []);
    if (!hiddenGuilds.includes(guildId)) {
      return updateSetting(id, 'hiddenGuilds', [ ...hiddenGuilds, guildId ]);
    }
  
    return updateSetting(id, 'hiddenGuilds', hiddenGuilds.filter(guild => guild !== guildId));
  },

  openFolder (dir) {
    const cmds = {
      win32: 'explorer',
      darwin: 'open',
      linux: 'xdg-open'
    };

    spawn(cmds[process.platform], [ dir ]);
  },

  async showCategory (sectionId) {
    contextMenu.closeContextMenu();

    const userSettingsWindow = (await getModule([ 'open', 'updateAccount' ]));
    userSettingsWindow.open();
    userSettingsWindow.setSection(sectionId);
  },

  async openUserSettings () {
    contextMenu.closeContextMenu();

    const UserSettingsWindow = (await getModule([ 'open', 'updateAccount' ]));
    UserSettingsWindow.open();
  },

  openModal (elem) {
    contextMenu.closeContextMenu();

    openModal(() => elem);
  },

  async forceUpdate (updateAll = true) {
    const contextMenuClasses = (await getModule([ 'itemToggle', 'checkbox' ]));
    const contextMenuQuery = `.${contextMenuClasses.contextMenu.replace(/ /g, '.')}`;

    if (document.querySelector(contextMenuQuery)) {
      forceUpdateElement(contextMenuQuery, updateAll);
    }
  },

  showSettingModal (opts) {
    const SettingModal = require('./components/SettingModal');
    this.openModal(React.createElement(SettingModal, {
      onConfirm: (value) => {
        powercord.api.settings.actions.updateSetting(opts.id, opts.key, value);

        if (typeof opts.setting.func !== 'undefined') {
          if (opts.setting.func.method && opts.setting.func.type === 'pluginManager') {
            powercord.pluginManager.get(opts.id)[opts.setting.func.method]();
          }
        }
      },
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
      input: {
        title: 'Passphrase',
        text: powercord.api.settings.store.getSetting('pc-general', 'passphrase'),
        type: 'password',
        icon: {
          name: 'Eye',
          tooltip: 'Show Password'
        }
      },
      button: {
        text: 'Reset to Default'
      },
      onConfirm: (value) => {
        updateSetting('pc-general', 'passphrase', value);
        closeModal();
      },
      onCancel: () => {
        updateSetting('pc-general', 'settingsSync', false);
        closeModal();
      },
      options: opts
    }));
  }
};
