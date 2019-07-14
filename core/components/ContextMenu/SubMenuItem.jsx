const { AsyncComponent } = require('powercord/components');
const { React, getModuleByDisplayName } = require('powercord/webpack');

const SubMenuItem = AsyncComponent.from(getModuleByDisplayName('FluxContainer(SubMenuItem)'));

module.exports = class NewSubMenuItem extends React.Component {
  render () {
    const itemSubMenu = React.createElement(SubMenuItem,
      Object.assign({}, this.props, null));

    if (this.props.seperated) {
      return (
        <div className='itemGroup-1tL0uz seperated'>
          {itemSubMenu}
        </div>
      )
    }

    return itemSubMenu;
  }
}
