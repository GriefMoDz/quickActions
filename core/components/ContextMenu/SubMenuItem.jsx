const { AsyncComponent } = require('powercord/components');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');

const SubMenuItem = AsyncComponent.from(getModuleByDisplayName('FluxContainer(SubMenuItem)'));

module.exports = class NewSubMenuItem extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      itemClasses: ''
    };
  }

  async componentWillMount () {
    this.setState({
      itemClasses: (await getModule([ 'itemToggle', 'checkbox' ]))
    });
  }

  render () {
    const { itemClasses } = this.state;
    const itemSubMenu = React.createElement('div', {
      className: 'quickActions-contextMenu-submenu',
      title: this.props.desc || null
    }, React.createElement(SubMenuItem,
      Object.assign({}, this.props, null))
    );

    if (this.props.seperated) {
      return (
        <div className={`${itemClasses.itemGroup} seperated`}>
          {itemSubMenu}
        </div>
      );
    }

    return itemSubMenu;
  }
};
