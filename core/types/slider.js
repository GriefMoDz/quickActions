const { React } = require('powercord/webpack');
const { SliderMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, plugin, setting) => {
  return React.createElement(SliderMenuItem, {
    label: setting.name,
    color: setting.color || '',
    disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id).call() : setting.disabled,
    defaultValue: powercord.api.settings.store.getSetting(typeof plugin.id !== 'undefined'
      ? id = plugin.id
      : id, key, setting.default),
    markers: setting.markers,
    minValue: setting.minValue,
    maxValue: setting.maxValue,
    seperated: setting.seperate ? true : '',
    onValueChange: setting.onValueChange.bind(this, (plugin.id ? id = plugin.id : id), key),
    onMarkerRender: setting.onMarkerRender
  });
}
