const { AsyncComponent, Tooltip } = require('powercord/components');
const { React, getModuleByDisplayName } = require('powercord/webpack');

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
      text: this.props.label.length > 21 ? this.props.label : '',
      position: 'right'
    }, React.createElement('div', {
      className: 'quickActions-contextMenu-checkbox'
    }, React.createElement(ToggleMenuItem,
      Object.assign({}, this.props, { action: this.handleToggle.bind(this) }))
    ));

    if (this.props.seperated) {
      return (
        <div className='itemGroup-1tL0uz seperated'>
          {itemToggle}
        </div>
      )
    }

    return itemToggle;
  }
}
