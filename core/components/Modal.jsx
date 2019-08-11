const { React, getModule } = require('powercord/webpack');
const { Tooltip, Button, Icon } = require('powercord/components');
const { Confirm } = require('powercord/components/modal');
const { TextInput } = require('powercord/components/settings');
const { close: closeModal } = require('powercord/modal');

let setting;

module.exports = class Modal extends React.Component {
  constructor (props) {
    super(props);

    this.options = this.props.options;
    this.state = {
      inputText: ''
    };
  }

  async componentDidMount () {
    this.setState({
      reset: (await getModule([ 'card', 'reset' ])).reset
    });
  }

  render () {
    const { inputText } = this.state;

    if (this.options && this.options.setting) {
      ({ setting } = this.options);

      if (!setting.default) {
        setting.default = '';
      }
    }

    return <div id={`${this.props.id || ''}`} class='quickActions-modal'>
      <Confirm
        red={this.props.red || false}
        header={this.props.header || null}
        confirmText={this.props.confirmText || 'Done'}
        cancelText={this.props.cancelText || null}
        onConfirm={() => this.props.onConfirm(inputText)}
        onCancel={() => typeof this.props.onCancel !== 'undefined' ? this.props.onCancel() : closeModal()}
        size={Confirm.Sizes[this.props.size ? this.props.size.toUpperCase() : null] || Confirm.Sizes.SMALL}
      >
        <div class='quickActions-modal-inner'>
          {this.options && this.options.key === 'clearCache' && (
            <div className='quickActions-modal-inner-desc'>
              Are you sure you want to clear cache?
              <div class='quickActions-modal-inner-spacer' />
              Proceeding will remove <b>everything</b> stored in your Discord's cache folder resulting in slower performance, as all

              <Tooltip text='(i.e. images, videos and avatars)' position='top'>
                <span> “resources” </span>
              </Tooltip>

              will need to fetched again.
            </div>
          )}

          {this.options && (this.options.key === 'passphrase' || this.options.key === 'settingsSync') && (
            <div id='update-passphrase' className='quickActions-modal-inner-desc'>
              This passphrase will be used to encrypt your data before sending it to Powercord's servers. It's recommended to
              use it, but you can just leave this empty and your data will be sent unencrypted.
              <div class='quickActions-modal-inner-spacer' />
              If you're already using sync on other machines, put the same passphrase you used.
              <b>Using another passphrase will overwrite old data, so be careful</b>.
              <div class='quickActions-modal-inner-spacer' />
              <div class='quickActions-modal-inner-desc-hint'>
                <b>Protip</b>: You can click the "eye" symbol below to show/hide your passphrase.
              </div>
            </div>
          )}

          {this.props.input && this.props.input.map((input, index) => (
            <div>
              <TextInput
                id='quickActions-textBox'
                style={index !== (this.props.input.length - 1) ? { marginBottom: '15px' } : {}}
                type={input.type || 'text'}
                disabled={input.disabled}
                defaultValue={input.hidden
                  ? `Click '${input.hidden.text}' to reveal.`
                  : input.text}
                onChange={value => this.setState({ inputText: value })}
              >
                {input.title}

                {input.icon && (
                  <div className='quickActions-hint'>
                    <Tooltip text={input.icon.tooltip || null} position='top'>
                      <Icon
                        name={input.icon.name}
                        onClick={() => {
                          if (input.icon.tooltip === 'Show Password') {
                            input.icon.tooltip = 'Hide Password';
                            input.icon.name = 'EyeHidden';
                            input.type = 'text';

                            return this.forceUpdate();
                          } else if (input.icon.tooltip === 'Hide Password') {
                            input.icon.tooltip = 'Show Password';
                            input.icon.name = 'Eye';
                            input.type = 'password';

                            return this.forceUpdate();
                          }

                          return false;
                        }} />
                    </Tooltip>
                  </div>
                )}
              </TextInput>

              {input.hidden && (
                <Button
                  className={this.state.reset}
                  color={Button.Colors.PRIMARY}
                  look={Button.Looks.LINK}
                  size={Button.Sizes.SMALL}
                  onClick={() => {
                    if (input.hidden.text.includes('Show')) {
                      input.hidden.text = input.hidden.text.replace('Show', 'Hide');
                      input.hidden.icon = 'EyeHidden';

                      document.querySelectorAll('#quickActions-textBox')[index].value = input.text;
                    } else if (input.hidden.text.includes('Hide')) {
                      input.hidden.text = input.hidden.text.replace('Hide', 'Show');
                      input.hidden.icon = 'Eye';

                      document.querySelectorAll('#quickActions-textBox')[index].value = `Click '${input.hidden.text}' ` +
                        'to reveal.';
                    }

                    this.forceUpdate();
                  }}
                >
                  {input.hidden.text}

                  <div className='quickActions-icon'>
                    <Icon name={input.hidden.icon} />
                  </div>
                </Button>
              )}
            </div>
          ))}

          {this.props.button && (
            <Button
              className={this.state.reset}
              color={Button.Colors.PRIMARY}
              look={Button.Looks.LINK}
              size={Button.Sizes.SMALL}
              onClick={() => {
                if (this.props.button.resetToDefault) {
                  this.setState({ inputText: setting.default });

                  return document.getElementById('quickActions-textBox').value = '';
                }

                this.props.button.onClick();
              }}
            >
              {this.props.button.resetToDefault ? 'Reset to Default' : this.props.button.text}

              <div className='quickActions-icon'>
                <Icon name={this.props.button.icon || ''} />
              </div>
            </Button>
          )}
        </div>
      </Confirm>
    </div>;
  }
};
