const { React, getModule } = require('powercord/webpack');
const { Tooltip } = require('powercord/components');

module.exports = class ImageMenuItem extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      itemClasses: '',
      props: {
        label: props.label,
        image: props.image,
        hint: props.hint
      }
    };
  }

  async componentWillMount () {
    this.setState({
      itemClasses: (await getModule([ 'itemToggle', 'checkbox' ]))
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
    const { itemClasses } = this.state;

    for (const key of Object.keys(this.state.props)) {
      if (!this.props.static) {
        this.props[key] = this.state.props[key];
      }
    }

    const item = (
      <Tooltip text={this.props.label.length >= 21 ? this.props.label : ''} position='right'>
        <div
          className={
            `quickActions-contextMenu-button ${[
              itemClasses.item,
              itemClasses.itemImage,
              itemClasses.clickable
            ].join(' ')} ${this.props.disabled ? 'disabled' : ''}`}
          title={this.props.desc || ''}
          onClick={this.handleClick.bind(this)}
        >
          <span style={this.props.danger ? { color: '#f04747' } : this.props.styles}>
            {this.props.label}
          </span>

          {this.props.image
            ? this.getItemImage()
            : <div className={itemClasses.hint}>{this.props.hint}</div>}
        </div>
      </Tooltip>
    );

    if (this.props.seperated) {
      return (
        <div className={`${itemClasses.itemGroup} seperated`}>
          {item}
        </div>
      );
    }

    return item;
  }

  getItemImage () {
    const { itemClasses } = this.state;

    return (
      this.props.image.startsWith('fa-')
        ? <div
          className={`${this.props.image.endsWith('-regular')
            ? 'far'
            : this.props.image.endsWith('-brand')
              ? 'fab'
              : 'fas'}
            ${this.props.image.replace(/-regular|-brand/gi, '')} fa-fw`} />
        : <img alt='' className={`${itemClasses.image} ${this.props.className || ''}`}
          src={this.props.image} />
    );
  }
};
