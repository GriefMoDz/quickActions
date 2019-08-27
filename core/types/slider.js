const { React } = require('powercord/webpack');
const { SliderMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, setting, main) => React.createElement(SliderMenuItem, {
  label: setting.name,
  desc: !main.settings.get('showDescriptions', true) ? '' : setting.desc,
  color: typeof setting.color === 'function' ? setting.color.bind(this, id)() : setting.color,
  disabled: typeof setting.disabled === 'function' ? setting.disabled.bind(this, id)() : setting.disabled,
  defaultValue: powercord.api.settings.store.getSetting(id, key, setting.default),
  markers: setting.markers,
  minValue: setting.minValue,
  maxValue: setting.maxValue,
  seperated: setting.seperate,
  onValueRender: setting.onValueRender,
  onValueChange: setting.onValueChange.bind(this, id, key),
  onMarkerRender: setting.onMarkerRender
});
