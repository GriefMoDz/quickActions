const { AsyncComponent } = require('powercord/components');
const { React, getModuleByDisplayName } = require('powercord/webpack');
const { ItemGroup } = require('./index.js');

const SubMenuItem = AsyncComponent.from(getModuleByDisplayName('FluxContainer(SubMenuItem)'));

module.exports = class NewSubMenuItem extends React.Component {
  render () {
    const itemSubMenu = React.createElement('div', {
      className: 'quickActions-contextMenu-submenu',
      title: this.props.desc || null
    }, React.createElement(SubMenuItem,
      Object.assign({}, this.props, null))
    );

    if (this.props.seperated) {
      return React.createElement(ItemGroup, {
        children: [ itemSubMenu ]
      });
    }

    return itemSubMenu;
  }
};
