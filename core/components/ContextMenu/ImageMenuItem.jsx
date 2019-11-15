const { React, getModule } = require('powercord/webpack');
const { Tooltip } = require('powercord/components');

/* eslint-disable multiline-ternary, object-property-newline */
module.exports = class ImageMenuItem extends React.Component {
  constructor (props) {
    super(props);

    this.styles = { regular: 'r', light: 'l', duotone: 'd', brands: 'b' };
    this.state = {
      classes: '',
      props: {
        label: props.label,
        image: props.image,
        icon: props.icon,
        hint: props.hint
      }
    };
  }

  async componentWillMount () {
    this.setState({
      classes: (await getModule([ 'itemToggle', 'checkbox' ]))
    });
  }

  handleClick () {
    this.props.disabled = !this.props.disabled;

    if (this.props.disabled) {
      this.props.action(this, this.props.disabled);
    }

    this.forceUpdate();
  }

  render () {
    const { classes } = this.state;

    for (const key of Object.keys(this.state.props)) {
      if (!this.props.static) {
        this.props[key] = this.state.props[key];
      }
    }

    const itemImage = (
      <Tooltip text={this.props.label.length >= 21 ? this.props.label : null} position='right' delay={750}>
        <div
          className={
            `quickActions-contextMenu-button ${[
              classes.item,
              classes.itemImage,
              classes.clickable,
              this.props.disabled ? 'disabled' : null
            ].filter(Boolean).join(' ')}`}
          title={this.props.desc || ''}
          onClick={this.props.action ? this.handleClick.bind(this) : null}
        >
          <span className={classes.label} style={this.props.danger ? { color: '#f04747' } : this.props.styles}>
            {this.props.label}
          </span>

          {this.props.image ? this.getItemImage() : this.props.icon
            ? this.getItemIcon()
            : <div className={classes.hint}>{this.props.hint}</div>}
        </div>
      </Tooltip>
    );

    if (this.props.seperated) {
      return (
        <div className={`${classes.itemGroup} seperated`}>
          {itemImage}
        </div>
      );
    }

    return itemImage;
  }

  getItemImage () {
    const { classes } = this.state;

    return <img alt='' className={[ this.props.className || null, classes.image ].filter(Boolean).join(' ')}
      src={this.props.image} />;
  }

  getItemIcon () {
    const styleRegex = new RegExp(/[a-z]+(?!.*-)/);
    const style = Object.keys(this.styles).find(style => style === this.props.icon.split(' ')[0].match(styleRegex)[0]);
    const icon = `fa-${this.props.icon.replace(`-${style}`, '')} fa-fw`;

    let prefix = 'fas';

    if (this.styles[style]) {
      prefix = `fa${this.styles[style]}`;
    }

    return <div className={`${prefix} ${icon}`} />;
  }
};
