const { React } = require('powercord/webpack');
const { ImageMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, setting, name, main) => {
  const mode = powercord.api.settings.store.getSetting(id, key, setting.default);

  return React.createElement(ImageMenuItem, {
    label: setting.newValue
      ? `Switch to ${mode !== setting.default ? setting.new.name : setting.name}`
      : setting.new ? setting.new.name : setting.name,
    desc: !main.settings.get('showDescriptions', true) ? '' : setting.desc,
    disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id)() : setting.disabled,
    danger: setting.dangerous,
    seperated: setting.seperate,
    hint: setting.newValue
      ? mode !== setting.default ? setting.new.hint : setting.hint
      : setting.new ? setting.new.hint : setting.hint,
    image: setting.image,
    icon: setting.icon,
    styles: { color: setting.modal ? '#43b581' : setting.color },
    static: typeof setting.new !== 'undefined' || setting.static,
    action: setting.modal && !setting.action
      ? () => main.utils.showSettingModal({ id,
        key,
        setting,
        name })
      : setting.newValue
        ? () => {
          main.utils.toggleButtonMode(id, key, setting);

          if (typeof setting.func !== 'undefined') {
            if (setting.func.method && setting.func.type === 'pluginManager') {
              powercord.pluginManager.get(id)[setting.func.method](setting.func.arguments
                ? setting.func.arguments
                : '');
            }
          }
        }
        : typeof setting.action === 'function'
          ? setting.action.bind(this, id, key, setting, name)
          : () => void 0
  });
};
