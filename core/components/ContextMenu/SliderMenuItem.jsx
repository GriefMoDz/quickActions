const { AsyncComponent } = require('powercord/components');
const { React, getModuleByDisplayName } = require('powercord/webpack');

const Slider = AsyncComponent.from(getModuleByDisplayName('Slider'));

module.exports = class SliderMenuItem extends React.Component {
  render () {
    const slider = (
      <div className='item-1Yvehc itemSlider-FZeYw0'>
        <div
          className='label-JWQiNe'
          style={this.props.markers ? { marginBottom: '16px' } : null}
        >
          {this.props.label}
        </div>

        {this.props.markers && (
          <Slider
            mini={true}
            className='slider-3BOep7 pc-slider'
            fillStyles={this.props.color ? { backgroundColor: this.props.color } : {}}
            equidistant={true}
            stickToMarkers={true}
            {...this.props}
          />
        )}

        {!this.props.markers && (
          <Slider
            mini={true}
            className='slider-3BOep7'
            fillStyles={this.props.color ? { backgroundColor: this.props.color } : {}}
            {...this.props}
          />
        )}
      </div>
    )

    if (this.props.seperated) {
      return (
        <div className='itemGroup-1tL0uz seperated'>
          {slider}
        </div>
      )
    }

    return slider;
  }
}
