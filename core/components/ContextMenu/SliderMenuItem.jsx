const { AsyncComponent } = require('powercord/components');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');

const Slider = AsyncComponent.from(getModuleByDisplayName('Slider'));

module.exports = class SliderMenuItem extends React.Component {
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
    const slider = (
      <div title={this.props.desc || ''} className={
        `quickActions-contextMenu-slider ${[
          itemClasses.item,
          itemClasses.itemSlider
        ].join(' ')}`}
      >
        <div
          className={itemClasses.label}
          style={this.props.markers ? { marginBottom: '16px' } : null}
        >
          {this.props.label}
        </div>

        {this.props.markers && (
          <Slider
            mini={true}
            className={itemClasses.slider}
            fillStyles={this.props.color ? { backgroundColor: this.props.color } : {}}
            equidistant={true}
            stickToMarkers={true}
            {...this.props}
          />
        )}

        {!this.props.markers && (
          <Slider
            mini={true}
            className={itemClasses.slider}
            fillStyles={this.props.color ? { backgroundColor: this.props.color } : {}}
            {...this.props}
          />
        )}
      </div>
    );

    if (this.props.seperated) {
      return (
        <div className={`${itemClasses.itemGroup} seperated`}>
          {slider}
        </div>
      );
    }

    return slider;
  }
};
