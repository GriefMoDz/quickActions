const { React } = require('powercord/webpack');
const { Tooltip } = require('powercord/components');

const utils = require('../../utils')();

module.exports = class ImageMenuItem extends React.Component {
  handleClick () {
    this.props.disabled = !this.props.disabled;

    if (this.props.disabled) {
      this.props.action(this.props.disabled);
    }

    utils.forceUpdate();
  }

  render () {
    const item = (
      <Tooltip text={this.props.label.length > 21 ? this.props.label : ''} position='right'>
        <div
          className={`quickActions-contextMenu-button item-1Yvehc itemImage-htIz_v
          ${this.props.disabled ? 'disabled' : ''}`}
          onClick={this.handleClick.bind(this)}
        >
          <span style={this.props.danger ? { color: '#f04747' } : this.props.styles}>
            {this.props.label}
          </span>

          {this.props.image
            ? this.getItemImage()
            : <div className='hint-22uc-R'>{this.props.hint}</div>}
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
      this.props.image.startsWith('fa-')
        ? <div
          className={`${this.props.image.endsWith('-regular')
            ? 'far'
            : this.props.image.endsWith('-brand')
              ? 'fab'
              : 'fas'}
            ${this.props.image.replace(/-regular|-brand/gi, '')} fa-fw`} />
        : <img alt='' className={this.props.className || ''}
          src={this.props.image} />
    );
  }
};
