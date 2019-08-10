const { open: openModal, close: closeModal } = require('powercord/modal');
const { forceUpdateElement, getOwnerInstance } = require('powercord/util');
const { React, contextMenu, getModule } = require('powercord/webpack');
const { spawn } = require('child_process');
const { actions: { updateSetting } } = powercord.api.settings;

module.exports = {
  getPlugins () {
    const disabledPlugins = powercord.settings.get('disabledPlugins', []);
    const hiddenPlugins = powercord.settings.get('hiddenPlugins', []);
    const plugins = [ ...powercord.pluginManager.plugins.keys() ]
      .filter(pluginId => !powercord.pluginManager.get('quickActions').settings.get('showHiddenPlugins', false)
        ? pluginId !== 'quickActions' && !hiddenPlugins.includes(pluginId)
        : pluginId !== 'quickActions')
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
      utils: this,
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
        text: 'Reset to Default'
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
  }
};
