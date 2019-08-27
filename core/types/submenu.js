const { React } = require('powercord/webpack');
const { SubMenuItem } = require('../components/ContextMenu');

module.exports = (id, key, plugin, setting, name, main) => {
  id = plugin.id ? { id } = plugin.id : id;

  const children = [];
  const submenu = React.createElement(SubMenuItem, {
    label: setting.children && setting.displayCounter
      ? `${setting.name} (${powercord.api.settings.store.getSetting(id, key, []).length})`
      : setting.name,
    desc: !main.settings.get('showDescriptions', true) ? '' : setting.desc,
    invertChildY: true,
    seperated: setting.seperate,
    render: typeof setting.children === 'function' ? setting.children.bind(this, id, key) : children,
    action: typeof setting.action === 'function' ? setting.action.bind(this, id, key) : null
  });

  for (const childKey in setting.children) {
    let child;
    const setting = plugin.settings[key].children[childKey];

    switch (setting.type) {
      case 'button':
        child = require('./button').bind(this, id, childKey, plugin, setting, name)(main);

        break;
      case 'submenu':
        child = require('./submenu').bind(this, id, childKey, plugin, setting, name)(main);

        break;
      case 'slider':
        child = require('./slider').bind(this, id, childKey, plugin, setting)(main);

        break;
      default:
        child = require('./checkbox').bind(this, id, childKey, plugin, setting)(main);

        break;
    }

    children.push(child);
  }

  return submenu;
};
