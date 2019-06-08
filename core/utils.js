const { getModule } = require('powercord/webpack');
const { spawn } = require('child_process');

let initSettings = false;

module.exports = {
  getPlugins () {
    const disabledPlugins = powercord.settings.get('disabledPlugins', []);
    const plugins = [ ...powercord.pluginManager.plugins.keys() ]
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

  openFolder (dir) {
    const cmds = {
      win32: 'explorer',
      darwin: 'open',
      linux: 'xdg-open'
    };
    spawn(cmds[process.platform], [ dir ]);
  },

  async showCategory (sectionId) {
    const UserSettingsWindow = (await getModule([ 'open', 'updateAccount' ]));
    UserSettingsWindow.open();
    UserSettingsWindow.setSection(sectionId);
  },

  async openUserSettings () {
    const UserSettingsWindow = (await getModule([ 'open', 'updateAccount' ]));
    UserSettingsWindow.open();

    if (!initSettings) {
      UserSettingsWindow.setSection('pc-general');
      initSettings = true;
    }
  },

  getPowercordIcon () {
    return 'data:image/png;base64,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';
  }
};
