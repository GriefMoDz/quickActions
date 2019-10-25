const { React, getModule } = require('powercord/webpack');

module.exports = class ItemGroup extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      classes: ''
    };
  }

  async componentWillMount () {
    this.setState({
      classes: (await getModule([ 'itemToggle', 'checkbox' ]))
    });
  }

  render () {
    const { classes } = this.state;
    const itemGroup = React.createElement('div', {
      className: `quickActions-contextMenu-itemGroup ${classes.itemGroup}`,
      children: this.props.children || []
    });

    return itemGroup;
  }
};
