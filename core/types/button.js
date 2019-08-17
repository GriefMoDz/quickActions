const { React } = require('powercord/webpack');
const { ImageMenuItem } = require('../components/ContextMenu');

const utils = require('../utils')();

module.exports = (id, key, plugin, setting, name) => {
  const mode = powercord.api.settings.store.getSetting(id, key, setting.default);

  return React.createElement(ImageMenuItem, {
    label: setting.newValue
      ? mode !== setting.default ? `Switch to ${setting.new.name}` : `Switch to ${setting.name}`
      : setting.new ? setting.new.name : setting.name,
    disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id).call() : setting.disabled,
    danger: setting.dangerous,
    seperated: setting.seperate,
    hint: setting.newValue
      ? mode !== setting.default ? `${setting.new.hint}` : `${setting.hint}`
      : setting.new ? setting.new.hint : setting.hint,
    image: setting.image,
    styles: { color: setting.modal ? '#43b581' : setting.color },
    action: setting.modal && !setting.action
      ? () => utils.showSettingModal({ id,
        key,
        setting,
        name })
      : setting.newValue
        ? () => {
          utils.toggleButtonMode(id, key, setting);

          if (typeof setting.func !== 'undefined') {
            if (setting.func.method && setting.func.type === 'pluginManager') {
              powercord.pluginManager.get(id)[setting.func.method](setting.func.arguments
                ? setting.func.arguments
                : '');
            }
          }
        }
        : typeof setting.action === 'function'
          ? setting.action.bind(this, (plugin.id ? { id } = plugin.id : id), key, setting, name)
          : () => void 0
  });
};
