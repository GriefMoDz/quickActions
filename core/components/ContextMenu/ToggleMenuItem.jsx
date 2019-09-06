const { AsyncComponent, Tooltip } = require('powercord/components');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');

const ToggleMenuItem = AsyncComponent.from(getModuleByDisplayName('ToggleMenuItem'));

module.exports = class NewToggleMenuItem extends React.Component {
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

  handleToggle () {
    this.props.active = !this.props.active;

    if (this.props.action) {
      this.props.action(this.props.active);
    }

    this.forceUpdate();
  }

  render () {
    const { itemClasses } = this.state;
    const itemToggle = React.createElement(Tooltip, {
      text: this.props.label.length >= 20 ? this.props.label : '',
      position: 'right'
    }, React.createElement('div', {
      className: 'quickActions-contextMenu-checkbox',
      title: this.props.desc || null
    }, React.createElement(ToggleMenuItem,
      Object.assign({}, this.props, { action: this.handleToggle.bind(this) }))
    ));

    if (this.props.seperated) {
      return (
        <div className={`${itemClasses.itemGroup} seperated`}>
          {itemToggle}
        </div>
      );
    }

    return itemToggle;
  }
};
