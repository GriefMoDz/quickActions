const { React, getModule } = require('powercord/webpack');

module.exports = class ItemGroup extends React.Component {
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
    const itemGroup = React.createElement('div', {
      className: `quickActions-contextMenu-itemGroup ${itemClasses.itemGroup}`,
      children: this.props.children || []
    });

    return itemGroup;
  }
};
