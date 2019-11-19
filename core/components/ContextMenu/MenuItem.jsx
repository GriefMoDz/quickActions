const { AsyncComponent } = require('powercord/components');
const { React, getAllModules } = require('powercord/webpack');
const { ItemGroup } = require('./index.js');

const MenuItem = AsyncComponent.from(getAllModules(m => m.name === 'd', false)[1]);

module.exports = class NewMenuItem extends React.Component {
  render () {
    const item = React.createElement(MenuItem,
      Object.assign({}, this.props, null));

    if (this.props.seperated) {
      return React.createElement(ItemGroup, {
        children: [ item ]
      });
    }

    return item;
  }
};
