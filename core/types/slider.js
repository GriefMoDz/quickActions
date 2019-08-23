const { React } = require('powercord/webpack');
const { SliderMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, plugin, setting) => React.createElement(SliderMenuItem, {
  label: setting.name,
  desc: setting.desc,
  color: typeof setting.color === 'function' ? setting.color.bind(this, id).call() : setting.color,
  disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id).call() : setting.disabled,
  defaultValue: powercord.api.settings.store.getSetting(typeof plugin.id !== 'undefined'
    ? { id } = plugin.id
    : id, key, setting.default),
  markers: setting.markers,
  minValue: setting.minValue,
  maxValue: setting.maxValue,
  seperated: setting.seperate,
  onValueRender: setting.onValueRender,
  onValueChange: setting.onValueChange.bind(this, (plugin.id ? { id } = plugin.id : id), key),
  onMarkerRender: setting.onMarkerRender
});
