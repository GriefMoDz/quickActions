const { React } = require('powercord/webpack');
const { SubMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, plugin, setting, name) => {
  const children = [];
  const submenu = React.createElement(SubMenuItem, {
    label: setting.children && setting.displayCounter
      ? `${setting.name} (${powercord.api.settings.store.getSetting(plugin.id ? { id } = plugin.id : id, key, []).length})`
      : setting.name,
    desc: !powercord.api.settings.store.getSetting('quickActions', 'showDescriptions', true) ? '' : setting.desc,
    invertChildY: true,
    seperated: setting.seperate,
    render: typeof setting.children === 'function'
      ? setting.children.bind(this, (plugin.id ? { id } = plugin.id : id), key)
      : children,
    action: typeof setting.action === 'function' ? setting.action.bind(this, id, key) : null
  });

  for (const childKey in setting.children) {
    let child;
    const setting = plugin.settings[key].children[childKey];

    switch (setting.type) {
      case 'button':
        child = require('./button')(id, childKey, plugin, setting, name);

        break;
      case 'submenu':
        child = require('./submenu')(id, childKey, plugin, setting, name);

        break;
      case 'slider':
        child = require('./slider')(id, childKey, plugin, setting);

        break;
      default:
        child = require('./checkbox')(id, childKey, plugin, setting);

        break;
    }

    children.push(child);
  }

  return submenu;
};
