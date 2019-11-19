const { React } = require('powercord/webpack');
const { actions: { toggleSetting } } = powercord.api.settings;
const { ToggleMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, setting, main) => React.createElement(ToggleMenuItem, {
  label: setting.name,
  desc: !main.settings.get('showDescriptions', true) ? '' : setting.desc,
  disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id)() : setting.disabled,
  danger: setting.dangerous,
  active: powercord.api.settings.store.getSetting(id, key, setting.default),
  className: 'quickActions-contextMenu-checkbox-fw',
  seperated: setting.seperate,
  action: (state) => {
    toggleSetting(id, key, setting.default);

    if (setting.action) {
      setting.action.bind(this, state, id, key, setting)();
    }

    if (typeof setting.func !== 'undefined') {
      if (setting.func.method && setting.func.type === 'pluginManager') {
        powercord.pluginManager.get(id)[setting.func.method](setting.func.arguments
          ? setting.func.arguments === 'state' ? state : setting.func.arguments
          : '');
      }
    }

    main.utils.forceUpdate();
  }
});
