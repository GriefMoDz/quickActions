const { existsSync, lstatSync } = require('fs');
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { AsyncComponent, Tooltip, Button, Icon } = require('powercord/components');
const { Confirm } = require('powercord/components/modal');
const { TextInput, SliderInput } = require('powercord/components/settings');
const { close: closeModal } = require('powercord/modal');

const FormTitle = AsyncComponent.from(getModuleByDisplayName('FormTitle'));
const SelectTempWrapper = AsyncComponent.from(getModuleByDisplayName('SelectTempWrapper'));
const TextArea = AsyncComponent.from(getModuleByDisplayName('TextArea'));
const ColorPicker = AsyncComponent.from(getModuleByDisplayName('ColorPicker'));

module.exports = class SettingModal extends React.Component {
  constructor (props) {
    super(props);

    this.plugin = props.main;
    this.options = props.options;
    this.state = {
      inputText: powercord.api.settings.store
        .getSetting(this.options.id, this.options.key, this.options.setting.default),
      valid: true
    };
  }

  async componentDidMount () {
    this.setState({
      reset: (await getModule([ 'card', 'reset' ])).reset,
      primary: (await getModule([ 'primary' ])).primary,
      getGuild: (await getModule([ 'getGuild' ])).getGuild
    });
  }

  render () {
    const { inputText, valid } = this.state;
    const { name, id, setting, key } = this.options;

    if (!setting.default) {
      setting.default = '';
    } else if (typeof setting.placeholder === 'function') {
      setting.placeholder = setting.placeholder.bind(this, id)();
    }

    const textArea = document.getElementById('quickActions-textArea');

    return <div id={id ? `${id.replace('pc-', '')}-${key}` : ''} className='quickActions-modal'>
      <Confirm
        red={false}
        header={`Plugin Settings${`—${name}` || null}`}
        confirmText='Save'
        cancelText='Cancel'
        onConfirm={() => valid ? this.props.onConfirm(inputText) : ''}
        onCancel={() => closeModal()}
        size={Confirm.Sizes[setting.modal.size ? setting.modal.size.toUpperCase() : null] ||
          Confirm.Sizes.SMALL}
      >
        <div className='quickActions-settingModal'>
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
                onChange={(item) => this.setState({ inputText: `${item ? item.value : setting.default}` })}
              />
            </div>
          }

          {key === 'format' &&
            <div>
              <FormTitle>{setting.name}</FormTitle>
              <SelectTempWrapper
                id='quickActions-selectBox'
                options={setting.modal.options}
                placeholder='Quick Insert: Select a variable...'
                maxMenuHeight={170}
                onMenuOpen={() => document.querySelector('.quickActions-modal > form')
                  .setAttribute('style', `height: ${225 + (40 * 4)}px;`)}
                onMenuClose={() => document.querySelector('.quickActions-modal > form')
                  .removeAttribute('style')}
                onChange={(item) => {
                  textArea.focus();

                  this.plugin.utils.insertAtCaret(textArea, item.value);
                  this.setState({ inputText: textArea.value });
                }}
              />

              <div style={{ marginBottom: '5px' }}></div>

              <TextArea
                id='quickActions-textArea'
                value={inputText === setting.default ? '' : inputText}
                placeholder={setting.default}
                rows={1}
                onChange={(value) => {
                  textArea.style.height = 'auto';
                  textArea.style.height = `${(textArea.scrollHeight) + 2}px`;

                  this.setState({ inputText: value });
                }}
                onFocus={() => {
                  textArea.style.height = 'auto';
                  textArea.style.height = `${(textArea.scrollHeight + 2)}px`;
                }}
              />

              <Button
                className={this.state.reset}
                color={this.state.primary}
                look={Button.Looks.LINK}
                size={Button.Sizes.SMALL}
                onClick={() => {
                  this.setState({ inputText: setting.default });

                  textArea.innerHTML = '';
                }}
              >
                Reset to Default
              </Button>
            </div>
          }

          {setting.modal.colorPicker &&
            <div>
              <FormTitle>{setting.name}
                {setting.desc && (
                  <div className='quickActions-hint'>
                    <Tooltip text={setting.desc} position='top' hideOnClick={false}>
                      <Icon name='Info' />
                    </Tooltip>
                  </div>
                )}
              </FormTitle>
              <ColorPicker
                colors={this.plugin.utils.getDefaultColors() || setting.colors}
                defaultColor={parseInt(setting.default.replace('#', ''), 16) || 0}
                onChange={(value) => this.setState({ color: value,
                  inputText: `#${value !== 0 ? parseInt(String(value)).toString(16) : '000000'}` })}
                value={this.state.color || parseInt(inputText.replace('#', ''), 16) || 0}
              >
              </ColorPicker>
            </div>
          }

          {setting.modal.slider &&
            <SliderInput
              className={'quickActions-slider'}
              equidistant={setting.modal.slider.markers !== false}
              stickToMarkers={setting.modal.slider.markers !== false}
              defaultValue={inputText}
              markers={setting.modal.slider.markers}
              minValue={setting.modal.slider.minValue}
              maxValue={setting.modal.slider.maxValue}
              onMarkerRender={setting.modal.slider.onMarkerRender ? setting.modal.slider.onMarkerRender.bind(this) : ''}
              onValueChange={(value) => this.setState({ inputText: parseInt(value) })}
            >
              {setting.name}
            </SliderInput>
          }

          {key !== 'defaultCloneId' && key !== 'format' && !setting.modal.colorPicker && !setting.modal.slider &&
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
                    <Tooltip text={setting.desc} position='top' hideOnClick={false}>
                      <Icon name='Info' />
                    </Tooltip>
                  </div>
                )}
              </TextInput>

              <Button
                className={this.state.reset}
                color={this.state.primary}
                look={Button.Looks.LINK}
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

    this.plugin.stores.sortedGuildsStore.getFlattenedGuilds().map(g => {
      const guild = {
        label: `${g.id} (${g.name})`,
        value: g.id
      };

      return guilds.push(guild);
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
