const { AsyncComponent } = require('powercord/components');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');

const MenuItem = AsyncComponent.from(getModuleByDisplayName('MenuItem'));

module.exports = class NewMenuItem extends React.Component {
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
    const item = React.createElement(MenuItem,
      Object.assign({}, this.props, null));

    if (this.props.seperated) {
      return (
        <div className={`${itemClasses.itemGroup} seperated`}>
          {item}
        </div>
      );
    }

    return item;
  }
};
