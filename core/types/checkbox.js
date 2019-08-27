const { React } = require('powercord/webpack');
const { actions: { toggleSetting } } = powercord.api.settings;
const { ToggleMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, plugin, setting, main) => {
  id = plugin.id ? { id } = plugin.id : id;

  return React.createElement(ToggleMenuItem, {
    label: setting.name,
    desc: !main.settings.get('showDescriptions', true) ? '' : setting.desc,
    disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id).call() : setting.disabled,
    active: powercord.api.settings.store.getSetting(id, key, setting.default),
    seperated: setting.seperate,
    action: (state) => {
      toggleSetting(id, key);

      if (setting.action) {
        setting.action.bind(this, state, id, key, setting).call();
      }

      if (typeof setting.func !== 'undefined') {
        if (setting.func.method && setting.func.type === 'pluginManager') {
          powercord.pluginManager.get(id)[setting.func.method](setting.func.arguments
            ? setting.func.arguments === 'state' ? state : setting.func.arguments
            : '');
        }
      }

      main.utils.forceUpdate(false, setting.updateHeight || '');
    }
  });
};
