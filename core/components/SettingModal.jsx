const { existsSync, lstatSync } = require('fs');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { AsyncComponent, Tooltip, Button, Icon } = require('powercord/components');
const { Confirm } = require('powercord/components/modal');
const { TextInput } = require('powercord/components/settings');
const { close: closeModal } = require('powercord/modal');

const FormTitle = AsyncComponent.from(getModuleByDisplayName('FormTitle'));
const SelectTempWrapper = AsyncComponent.from(getModuleByDisplayName('SelectTempWrapper'));

module.exports = class SettingModal extends React.Component {
  constructor (props) {
    super(props);

    this.options = this.props.options;
    this.state = {
      inputText: powercord.api.settings.store
        .getSetting(this.options.id, this.options.key, this.options.setting.default),
      valid: true
    };
  }

  async componentDidMount () {
    this.setState({
      reset: (await getModule([ 'card', 'reset' ])).reset,
      getGuild: (await getModule([ 'getGuild' ])).getGuild
    });
  }

  render () {
    const { inputText, valid } = this.state;
    const { name, id, setting, key } = this.options;

    if (!setting.default) {
      setting.default = '';
    } else if (id === 'swerve' && key === 'words') {
      setting.placeholder = powercord.pluginManager.get(id).defaultWords.join('|');
    }

    return <div id={id ? `${id.replace('pc-', '')}-${key}` : null} class='quickActions-modal'>
      <Confirm
        red={false}
        header={`Plugin Settings—${name || null}`}
        confirmText='Save'
        cancelText='Cancel'
        onConfirm={() => {
          if (!valid) {
            return;
          }

          this.props.onConfirm(inputText);
        }}
        onCancel={() => closeModal()}
        size={Confirm.Sizes[setting.modal.size
          ? setting.modal.size.toUpperCase()
          : null
        ] || Confirm.Sizes.SMALL}
      >
        <div class='quickActions-settingModal'>
          {key === 'defaultCloneId' &&
            <div>
              <FormTitle>{setting.name}</FormTitle>
              <SelectTempWrapper
                id='quickActions-selectBox'
                options={this.getGuilds()}
                value={inputText}
                placeholder='Select a server...'
                clearable={true}
                maxMenuHeight={170}
                onMenuOpen={() => document.querySelector('.quickActions-modal > form')
                  .setAttribute('style', `height: ${this.getGuilds().length > 0
                    ? 220 + (40 * (this.getGuilds().length < 4 ? this.getGuilds().length : 4))
                    : 253}px;`)}
                onMenuClose={() => document.querySelector('.quickActions-modal > form')
                  .removeAttribute('style')}
                onChange={(item) => {
                  if (!item) {
                    return this.setState({ inputText: setting.default });
                  }

                  this.setState({ inputText: item.value });
                }}
              />
            </div>
          }

          {key !== 'defaultCloneId' &&
            <div>
              <TextInput
                id='quickActions-textBox'
                type='text'
                required={setting.required}
                style={!valid ? { borderColor: '#f04747' } : {}}
                placeholder={setting.default && setting.placeholder
                  ? setting.placeholder
                  : !setting.default ? setting.placeholder || '' : setting.default}
                defaultValue={inputText === (setting.default || setting.placeholder)
                  ? ''
                  : inputText}
                onChange={(value) => {
                  if (setting.modal.realtime) {
                    this.validate(value);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    this.validate(e.target.value);

                    if (!setting.modal.custom) {
                      e.target.value = this.validate(e.target.value);

                      return this.setState({ inputText: e.target.value });
                    }
                  }
                }}
                onBlur={(e) => {
                  this.validate(e.target.value);

                  if (!setting.modal.custom) {
                    e.target.value = this.validate(e.target.value);

                    return this.setState({ inputText: e.target.value });
                  }
                }}
              >
                {setting.name}

                {setting.desc && (
                  <div className='quickActions-hint'>
                    <Tooltip text={setting.desc} position='top'>
                      <Icon name='Info' />
                    </Tooltip>
                  </div>
                )}
              </TextInput>

              <Button
                className={this.state.reset}
                color={Button.Colors.PRIMARY}
                look={Button.Looks.LINK}
                size={Button.Sizes.SMALL}
                onClick={() => {
                  this.setState({ inputText: setting.default,
                    valid: true });

                  document.getElementById('quickActions-textBox').value = '';
                }}
                >
                Reset to Default
              </Button>
            </div>
          }
        </div>
      </Confirm>
    </div>;
  }

  getGuilds () {
    const guilds = [];

    powercord.pluginManager.get('quickActions').getGuilds().map(g => {
      const guild = {
        label: `${g.id} (${g.name})`,
        value: g.id
      };

      guilds.push(guild);
    });

    return guilds;
  }

  validate (value) {
    const { setting } = this.options;
    const domain = /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    const validators = {
      interval: (Number(value) && Number(value) >= 1) ? Number(value) : 15
    };

    if (value.length <= 0) {
      this.setState({ inputText: setting.default,
        valid: true });

      return setting.default;
    } else if (setting.hex) {
      if (!(/^#[a-f0-9]{3}(?:[a-f0-9]{3})?$/).test(value)) {
        return this.setState({ valid: false });
      }

      return this.setState({ inputText: value,
        valid: true });
    } else if (setting.domain) {
      if (!domain.test(value)) {
        return this.setState({ valid: false });
      }

      return this.setState({ inputText: value,
        valid: true });
    }

    switch (this.options.key) {
      case 'defaultCloneId':
        if (this.state.getGuild(value)) {
          return this.setState({ inputText: value,
            valid: true });
        }

        this.setState({ valid: false });

        break;
      case 'filePath':
        if (existsSync(value) && lstatSync(value).isDirectory()) {
          return this.setState({ inputText: value,
            valid: true });
        }

        this.setState({ valid: false });

        break;
      case 'words':
        if (value.split('|').filter(Boolean).some(word => word.length < 4)) {
          return this.setState({ valid: false });
        }

        value = value.split('|').filter(Boolean).length
          ? value.split('|').filter(Boolean)
          : setting.placeholder;

        this.setState({ inputText: value,
          valid: true });

        break;
      default:
        for (const key in validators) {
          if (this.options.key === key) {
            return validators[key];
          }
        }

        return value;
    }
  }
};
