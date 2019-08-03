const { AsyncComponent } = require('powercord/components');
const { React, getModuleByDisplayName } = require('powercord/webpack');

const MenuItem = AsyncComponent.from(getModuleByDisplayName('MenuItem'));

module.exports = class NewMenuItem extends React.Component {
  render () {
    const item = React.createElement(MenuItem,
      Object.assign({}, this.props, null));

    if (this.props.seperated) {
      return (
        <div className='itemGroup-1tL0uz seperated'>
          {item}
        </div>
      );
    }

    return item;
  }
};
