const { AsyncComponent, Tooltip } = require('powercord/components');
const { React, getModuleByDisplayName } = require('powercord/webpack');
const { ItemGroup } = require('./index.js');

const ToggleMenuItem = AsyncComponent.from(getModuleByDisplayName('ToggleMenuItem'));

module.exports = class NewToggleMenuItem extends React.Component {
  handleToggle () {
    this.props.active = !this.props.active;

    if (this.props.action) {
      this.props.action(this.props.active);
    }

    this.forceUpdate();
  }

  render () {
    const itemToggle = React.createElement(Tooltip, {
      text: this.props.label.length >= 20 ? this.props.label : null,
      hideOnClick: false,
      position: 'right',
      delay: 750
    }, React.createElement('div', {
      className: 'quickActions-contextMenu-checkbox',
      title: this.props.desc || ''
    }, React.createElement(ToggleMenuItem,
      Object.assign({}, this.props, { action: this.handleToggle.bind(this) }))
    ));

    if (this.props.seperated) {
      return React.createElement(ItemGroup, {
        children: [ itemToggle ]
      });
    }

    return itemToggle;
  }
};
