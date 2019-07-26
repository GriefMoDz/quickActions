const { React } = require('powercord/webpack');
const { actions: { toggleSetting } } = powercord.api.settings;
const { ToggleMenuItem } = require('../components/ContextMenu');

const utils = require('../utils');

module.exports = (id, key, plugin, setting) => {
  return React.createElement(ToggleMenuItem, {
    label: setting.name,
    disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id).call() : setting.disabled,
    active: powercord.api.settings.store.getSetting((plugin.id
      ? id = plugin.id
      : id), key, setting.default),
    seperated: setting.seperate ? true : '',
    action: (state) => {
      toggleSetting((plugin.id ? id = plugin.id : id), key);

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

      utils.forceUpdate(false, setting.updateHeight || '');
    }
  });
}
