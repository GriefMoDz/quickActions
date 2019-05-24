const { React, getModule } = require('powercord/webpack');
const { Confirm } = require('powercord/components/modal');
const { Tooltip, Button, Icon } = require('powercord/components');
const { TextInput } = require('powercord/components/settings');
const { close: closeModal } = require('powercord/modal');

const { actions: { updateSetting } } = powercord.api.settings;

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
    let { inputText } = this.state;
    const { name, id, setting, key } = this.options;

    if (!setting.default) {
      setting.default = '';
    }

    return <Confirm
      red={false}
      header={`Plugin Settings—${name || null}`}
      confirmText='Save'
      cancelText='Cancel'
      onConfirm={() => {
        updateSetting(id, key, inputText);

        if (typeof setting.func !== 'undefined') {
          if (setting.func.method && setting.func.type === 'pluginManager') {
            powercord.pluginManager.get(id)[setting.func.method]();
          }
        }

        closeModal();
      }}
      onCancel={() => closeModal()}
    >
      <div class='quickActions-settingModal'>
        <TextInput
          type='text'
          required={setting.required}
          placeholder={!setting.default ? setting.placeholder || '' : setting.default}
          defaultValue={powercord.api.settings.store.getSetting(id, key, setting.default) === setting.default
            ? ''
            : powercord.api.settings.store.getSetting(id, key, setting.default)}
          onChange={(value) => value.length > 0 ? inputText = this.validate(value) : inputText = setting.default}
          onBlur={(e) => {
            e.target.value = this.validate(e.target.value);
            return e.target.value.length > 0 ? inputText = e.target.value : inputText = setting.default;
          }}
        >
          {setting.name}

          {setting.desc && (
            <Tooltip text={setting.desc} position='top'>
              <div className="quickActions-hint">
                <Icon className="pc-icon" name="Info" />
              </div>
            </Tooltip>
          )}
        </TextInput>

        <Button
          className={this.state.reset}
          color={Button.Colors.PRIMARY}
          look={Button.Looks.LINK}
          size={Button.Sizes.SMALL}
          onClick={() => {
            inputText = setting.default;
            document.querySelector('input').value = '';
          }}
        >
          Reset to Default
        </Button>
      </div>
    </Confirm>;
  }

  validate (value) {
    const validators = {
      domain: [ value.endsWith('/') ? value.slice(0, -1) : value ],
      interval: [ (Number(value) && Number(value) >= 1) ? Number(value) : 15 ]
    };

    for (const key in validators) {
      if (this.options.key === key) {
        return validators[key];
      }
    }

    return value;
  }
};
