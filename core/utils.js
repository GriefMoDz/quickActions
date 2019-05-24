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
  }
};
