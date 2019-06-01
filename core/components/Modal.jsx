const { React, getModule } = require('powercord/webpack');
const { Tooltip, Button, Icon } = require('powercord/components');
const { Confirm } = require('powercord/components/modal');
const { TextInput } = require('powercord/components/settings');
const { close: closeModal } = require('powercord/modal');

let setting;

module.exports = class SettingModal extends React.Component {
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

    return <Confirm
      red={this.props.red}
      header={this.props.header || null}
      confirmText={this.props.confirmText || 'Done'}
      cancelText={this.props.cancelText || null}
      onConfirm={() => this.props.onConfirm(inputText)}
      onCancel={() => closeModal()}
      size={Confirm.Sizes[this.props.size] || Confirm.Sizes.SMALL}
    >
      <div class='quickActions-modal'>
        {this.props.header === 'Clear cache' && (
          <div className='quickActions-modal-desc'>
            Are you sure you want to clear cache?
            <div class='quickActions-modal-spacer' />
            Proceeding will remove <b>everything</b> stored in your Discord's cache folder resulting in slower performance, as all

            <Tooltip text='(i.e. images, videos and avatars)' position='top'>
              <span> “resources” </span>
            </Tooltip>

            will need to fetched again.
          </div>
        )}

        {this.props.header === 'Update passphrase' && (
          <div id='update-passphrase' className='quickActions-modal-desc'>
            This passphrase will be used to encrypt your data before sending it to Powercord's servers. It's recommended to
            use it, but you can just leave this empty and your data will be sent unencrypted.
            <div class='quickActions-modal-spacer' />
            If you're already using sync on other machines, put the same passphrase you used.
            <b>Using another passphrase will overwrite old data, so be careful</b>
            <div class='quickActions-modal-spacer' />
            <div class='quickActions-modal-desc-hint'>
              <b>Protip</b>: You can click the "eye" symbol below to show/hide your passphrase.
            </div>
          </div>
        )}

        {this.props.input && (
          <TextInput
            type={this.props.input.type || 'text'}
            disabled={this.props.input.disabled}
            defaultValue={this.props.input.text}
            onChange={value => this.setState({ inputText: value })}
          >
            {this.props.input.title}

            {this.props.input.icon && (
              <Tooltip text={this.props.input.icon.tooltip || null} position='top'>
                <div className="quickActions-hint">
                  <Icon
                    name={this.props.input.icon.name}
                    onClick={() => {
                      const { input } = this.props;

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
                </div>
              </Tooltip>
            )}
          </TextInput>
        )}

        {this.props.button && (
          <Button
            className={this.state.reset}
            color={Button.Colors.PRIMARY}
            look={Button.Looks.LINK}
            size={Button.Sizes.SMALL}
            onClick={() => {
              if (this.props.button.text === 'Reset to Default') {
                this.setState({ inputText: setting.default });

                return document.querySelector('input').value = '';
              }

              this.props.button.onClick();
            }}
          >
            {this.props.button.text}

            <div className="quickActions-icon">
              <Icon name={this.props.button.icon || ''} />
            </div>
          </Button>
        )}
      </div>
    </Confirm>;
  }
};