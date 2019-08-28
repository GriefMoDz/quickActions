const { React } = require('powercord/webpack');
const { Tooltip } = require('powercord/components');

const utils = require('../../utils')();

module.exports = class ImageMenuItem extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      label: props.label,
      image: props.image,
      hint: props.hint,
      disabled: props.disabled
    };
  }

  handleClick () {
    this.state.disabled = !this.state.disabled;

    if (this.state.disabled) {
      this.props.action(this.state, this.state.disabled);
    }

    utils.forceUpdate();
  }

  render () {
    const item = (
      <Tooltip text={this.state.label.length >= 21 ? this.state.label : ''} position='right'>
        <div
          className={`quickActions-contextMenu-button item-1Yvehc itemImage-htIz_v
          ${this.state.disabled ? 'disabled' : ''}`}
          title=''
          onClick={this.handleClick.bind(this)}
        >
          <span style={this.props.danger ? { color: '#f04747' } : this.props.styles}>
            {this.props.static ? this.props.label : this.state.label}
          </span>

          {this.props.image
            ? this.getItemImage()
            : <div className='hint-22uc-R'>{this.props.static ? this.props.hint : this.state.hint}</div>}
        </div>
      </Tooltip>
    );

    if (this.props.seperated) {
      return (
        <div className='itemGroup-1tL0uz seperated'>
          {item}
        </div>
      );
    }

    return item;
  }

  getItemImage () {
    return (
      this.state.image.startsWith('fa-')
        ? <div
          className={`${this.state.image.endsWith('-regular')
            ? 'far'
            : this.state.image.endsWith('-brand')
              ? 'fab'
              : 'fas'}
            ${this.state.image.replace(/-regular|-brand/gi, '')} fa-fw`} />
        : <img alt='' className={this.props.className || ''}
          src={this.state.image} />
    );
  }
};
