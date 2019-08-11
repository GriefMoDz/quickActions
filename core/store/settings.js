const { React, getModule } = require('powercord/webpack');
const { forceUpdateElement, waitFor } = require('powercord/util');
const { close: closeModal } = require('powercord/modal');
const { actions: { updateSetting } } = powercord.api.settings;

const utils = require('../utils');
const GenericModal = require('../components/Modal');

const { ImageMenuItem, SubMenuItem, ToggleMenuItem } = require('../components/ContextMenu');

module.exports = () => [
  {
    advancedTitle: {
      id: 'advanced-title-bar',
      unofficial: true,
      settings: {
        limit: {
          name: 'Limit Title Bar Games',
          default: 40,
          type: 'slider',
          minValue: 1,
          maxValue: 40,
          onValueChange: async (id, key, value) => {
            const titleBarClasses = (await getModule([ 'titleBar' ]));
            const titleBar = `.${titleBarClasses.titleBar.replace(/ /g, '')}`;

            updateSetting(id, key, parseInt(value));
            forceUpdateElement(titleBar);

            utils.forceUpdate();
          },
          hide: () => !powercord.pluginManager.isEnabled('pc-titleBarGames') ||
            process.platform !== 'win32'
        }
      }
    },
    auditory: {
      unofficial: true,
      settings: {
        mode: {
          name: 'FFT',
          default: 'amp',
          type: 'button',
          hint: 'Amp',
          color: '#43b581',
          newValue: 'fft',
          new: {
            name: 'Amplitude',
            hint: 'FFT'
          },
          func: {
            method: 'reload',
            type: 'pluginManager'
          }
        },
        beastiness: {
          name: 'Beastiness',
          default: 1,
          type: 'slider',
          color: (id) => powercord.api.settings.store.getSetting(id, 'color', null),
          seperate: true,
          markers: [ 1, 2, 3, 4, 5 ],
          onValueChange: (id, key, value) => {
            updateSetting(id, key, parseInt(value));

            powercord.pluginManager.get(id).reload();

            utils.forceUpdate();
          }
        },
        brightness: {
          name: 'Brightness (%)',
          default: 1,
          type: 'slider',
          color: (id) => powercord.api.settings.store.getSetting(id, 'color', null),
          onValueChange: (id, key, value) => {
            updateSetting(id, key, parseInt(value));

            powercord.pluginManager.get(id).reload();

            utils.forceUpdate();
          }
        },
        important: {
          name: 'Override Styling',
          default: false,
          seperate: true,
          func: {
            method: 'reload',
            type: 'pluginManager'
          }
        },
        color: {
          name: 'Visualizer Color',
          type: 'button',
          image: 'fa-eye',
          seperate: true,
          default: '#7289da',
          modal: {
            colorPicker: true
          },
          func: {
            method: 'reload',
            type: 'pluginManager'
          }
        },
        defaultcolor: {
          name: 'Idle Color',
          desc: '(When no audio is playing)',
          type: 'button',
          image: 'fa-eye-slash',
          default: '#202225',
          modal: {
            colorPicker: true
          },
          func: {
            method: 'reload',
            type: 'pluginManager'
          }
        }
      }
    },
    'axelgreavette-helpful-utilites': {
      unofficial: true,
      settings: {
        'hu-cmd-trbmb': {
          name: 'Toggle TRBMB command',
          default: false
        },
        'hu-cmd-id': {
          name: 'Toggle ID command',
          default: false
        }
      }
    },
    betterfriends: {
      unofficial: true,
      settings: {
        infomodal: {
          name: 'Show Information Modal',
          default: true,
          func: {
            method: 'reload',
            arguments: 'InformationModal',
            type: 'pluginManager'
          }
        },
        displaystar: {
          name: 'Display Star',
          default: true,
          func: {
            method: 'reload',
            arguments: 'DisplayStar',
            type: 'pluginManager'
          }
        },
        statuspopup: {
          name: 'Show Status Notifications',
          default: true,
          func: {
            method: 'reload',
            arguments: 'StatusPopup',
            type: 'pluginManager'
          }
        }
      }
    },
    'cadence-contextPlus': {
      unofficial: true,
      settings: {
        patchUser: {
          name: 'User Context Menu',
          default: true
        },
        patchGuild: {
          name: 'Guild Context Menu',
          default: true
        }
      }
    },
    lightify: {
      unofficial: true,
      settings: {
        YeeLight: {
          name: 'YeeLight',
          default: false
        },
        Lifx: {
          name: 'Lifx',
          default: false
        },
        AutoOn: {
          name: 'Auto-On',
          default: false
        },
        BulbIP: {
          name: 'YeeLight Device IP',
          desc: 'Set the IP address of the YeeLight light you want to use!',
          type: 'button',
          image: 'fa-globe',
          default: '192.168.0.100',
          seperate: true,
          modal: true
        },
        LifxName: {
          name: 'Lifx Device Name',
          desc: 'Enter the device name of the Lifx lamp you want to pulse!',
          type: 'button',
          image: 'fa-font',
          default: 'MyCeilingLight',
          modal: true
        },
        BulbBright: {
          name: 'YeeLight Brightness (%)',
          default: 100,
          type: 'slider',
          seperate: true,
          onValueChange: (id, key, value) => {
            updateSetting(id, key, parseInt(value));

            utils.forceUpdate();
          }
        },
        BulbColor: {
          name: 'Lamp Color',
          desc: 'Set the color you want the light to flash when you get mentioned. For example, #00ff00 would make it green.',
          type: 'button',
          image: 'fa-palette',
          default: '#7289da',
          seperate: true,
          modal: {
            colorPicker: true
          }
        },
        BulbDuration: {
          name: 'Pulse Duration',
          default: 250,
          type: 'slider',
          seperate: true,
          maxValue: 60000,
          onValueRender: (value) => `${parseFloat(value / 1000).toFixed(2)}s`,
          onValueChange: (id, key, value) => {
            updateSetting(id, key, parseInt(value));

            utils.forceUpdate();
          }
        }
      }
    },
    mu: {
      id: 'powercord-multiuser',
      unofficial: true,
      settings: {
        users: {
          name: 'Users',
          children: (id, key) => {
            const children = [];
            const users = powercord.api.settings.store.getSetting(id, key, []);

            users.map(user => {
              const child = React.createElement(ImageMenuItem, {
                label: user.nickname || 'Untitled',
                seperated: true,
                modal: true,
                action: () => utils.openModal(React.createElement(GenericModal, {
                  id: 'quickActions-mu-users',
                  header: `${user.nickname || 'Untitled'}—Mu`,
                  confirmText: 'Done',
                  cancelText: 'Remove User',
                  input: [
                    {
                      title: 'Account Name',
                      text: user.nickname
                    },
                    {
                      title: 'Account Token',
                      text: user.token,
                      disabled: true,
                      hidden: {
                        text: 'Show account token',
                        icon: 'Eye'
                      }
                    }
                  ],
                  onConfirm: (nickname) => {
                    if (nickname !== '' && users.includes(user)) {
                      user.nickname = nickname;

                      updateSetting(id, key, users);
                    }

                    closeModal();
                  },
                  onCancel: () => {
                    const index = users.indexOf(user);

                    if (index > 0) {
                      updateSetting(id, key, users.filter(u => u !== user));
                    }

                    closeModal();
                  }
                }))
              });

              return children.push(child);
            });

            return children;
          },
          type: 'submenu'
        },
        addUser: {
          name: 'Add New User',
          type: 'button',
          image: 'fa-user-plus',
          seperate: true,
          modal: true,
          action: (id, _, setting, name) => utils.openModal(React.createElement(GenericModal, {
            header: `Add New User—${name}`,
            confirmText: 'Add User',
            cancelText: 'Cancel',
            input: [
              {
                title: 'User Account Token',
                text: ''
              }
            ],
            button: {
              resetToDefault: true
            },
            onConfirm: (token) => {
              const users = powercord.api.settings.store.getSetting(id, 'users', []);

              if (token) {
                updateSetting(id, 'users', users.concat([ {
                  nickname: null,
                  token
                } ]));
              }

              closeModal();
            },
            options: { setting }
          }))
        }
      }
    },
    'pc-clickableEdits': {
      settings: {
        dualControlEdits: {
          name: 'Dual Control Edits',
          default: false
        },
        rightClickEdits: {
          name: 'Swap Primary Button',
          default: false
        },
        clearContent: {
          name: 'Clear Content',
          default: false,
          disabled: (id) => powercord.api.settings.store.getSetting(id,
            'dualControlEdits', false)
        },
        useShiftKey: {
          name: 'Use Shift Key',
          default: false,
          disabled: (id) => powercord.api.settings.store.getSetting(id,
            'dualControlEdits', false)
        }
      }
    },
    'pc-cadence-pluginUpdater': {
      unofficial: true,
      settings: {
        pluginDirectory: {
          name: 'Plugin Directory',
          type: 'button',
          image: 'fa-folder-open',
          modal: true,
          action: (_, __, ___, name) => utils.openModal(React.createElement(GenericModal, {
            header: `Plugin Directory—${name}`,
            confirmText: 'Done',
            input: [
              {
                title: 'Current Working Directory (cwd)',
                text: powercord.pluginManager.pluginDir,
                disabled: true
              }
            ],
            button: {
              text: 'Open Plugin Directory',
              icon: 'ExternalLink',
              onClick: () => utils.openFolder(powercord.pluginManager.pluginDir)
            },
            onConfirm: () => closeModal()
          }))
        },
        updatePlugins: {
          name: 'Update Plugins',
          type: 'button',
          image: 'fa-cogs',
          color: '#7289da',
          seperate: true,
          action: async (id) => {
            utils.showCategory(id);

            await waitFor('.plugin-updater-button-container');

            const updateBtnContainer = document
              .getElementsByClassName('plugin-updater-button-container')[0];
            const updateBtn = updateBtnContainer.children[0];

            updateBtn.click();
          }
        }
      }
    },
    'pc-discordrpc': {
      unofficial: true,
      settings: {
        clientid: {
          name: 'Client ID',
          desc: 'ID used to start the Discord RPC.',
          type: 'button',
          image: 'fa-id-card',
          required: true,
          modal: true
        },
        textSettings: {
          name: 'Text Settings',
          children: {
            lineone: {
              name: 'Line One',
              desc: 'First line of the Discord RPC.',
              type: 'button',
              image: 'fa-pencil-alt',
              default: 'Hello!',
              required: true,
              modal: true
            },
            linetwo: {
              name: 'Line Two',
              desc: 'Second line of the Discord RPC.',
              type: 'button',
              image: 'fa-pencil-alt',
              modal: true
            }
          },
          type: 'submenu',
          seperate: true
        },
        imageSettings: {
          name: 'Image Settings',
          children: {
            largeimage: {
              name: 'Large Image',
              desc: 'Large image shown on the Discord RPC.',
              type: 'button',
              image: 'fa-file-image',
              modal: true
            },
            largeimagetext: {
              name: 'Large Image Text',
              desc: 'Text shown when hovering over the large image.',
              type: 'button',
              image: 'fa-pencil-alt',
              modal: true
            },
            smallimage: {
              name: 'Small Image',
              desc: 'Small image shown on the Discord RPC.',
              type: 'button',
              image: 'fa-file-image',
              modal: true
            },
            smallimagetext: {
              name: 'Small Image Text',
              desc: 'Text shown when hovering over the small image.',
              type: 'button',
              image: 'fa-pencil-alt',
              modal: true
            }
          },
          type: 'submenu'
        },
        timestamp: {
          name: 'Show Timestamp',
          default: false,
          seperate: true
        },
        commandsEnabled: {
          name: 'Use Commands',
          default: false,
          func: {
            method: 'modifyCommands',
            type: 'pluginManager'
          }
        }
      }
    },
    'pc-emojiUtility': {
      settings: {
        useEmbeds: {
          name: 'Use Embeds',
          default: false
        },
        displayLink: {
          name: 'Display Link',
          default: true,
          disabled: (id) => powercord.api.settings.store.getSetting(id,
            'useEmbeds', false)
        },
        filePath: {
          name: 'Save Directory',
          desc: 'The directory emotes will be saved to.',
          type: 'button',
          image: 'fa-save',
          seperate: true,
          modal: {
            realtime: true,
            custom: true
          }
        },
        includeIdForSavedEmojis: {
          name: 'Include ID when Saving Emotes',
          default: true,
          seperate: true
        },
        defaultCloneIdUseCurrent: {
          name: 'Use Current Server when Cloning Emotes',
          default: false
        },
        defaultCloneId: {
          name: 'Default Server ID when Cloning Emotes',
          desc: 'The default server ID which will be used to save cloned emotes.',
          type: 'button',
          image: 'fa-hdd',
          seperate: true,
          modal: true,
          disabled: (id) => powercord.api.settings.store.getSetting(id,
            'defaultCloneIdUseCurrent', false)
        },
        hiddenGuilds: {
          name: 'Hide Emotes',
          children: (id, key) => {
            const children = [];
            const hiddenGuilds = powercord.api.settings.store.getSetting(id, key, []);
            const { sortedGuildsStore } = powercord.pluginManager
              .get('quickActions').state;

            sortedGuildsStore.getSortedGuilds().map(guild => {
              let child;
              const { guilds } = guild;

              if (guild.folderId) {
                const servers = [];

                guilds.map(server =>
                  servers.push(React.createElement(ToggleMenuItem, {
                    label: server.name,
                    active: hiddenGuilds.includes(server.id),
                    action: () => utils.handleGuildToggle(server.id)
                  }))
                );

                child = React.createElement(SubMenuItem, {
                  label: guild.folderName,
                  invertChildY: true,
                  seperated: true,
                  render: servers
                });
              } else {
                child = React.createElement(ToggleMenuItem, {
                  label: guilds[0].name,
                  active: hiddenGuilds.includes(guilds[0].id),
                  action: () => utils.handleGuildToggle(guilds[0].id),
                  seperated: children.length > 0 && children[children.length - 1].type.name === 'NewSubMenuItem'
                    ? true
                    : ''
                });
              }

              return children.push(child);
            });

            return children;
          },
          type: 'submenu',
          seperate: true
        }
      }
    },
    'pc-general': {
      settings: {
        prefix: {
          name: 'Command Prefix',
          default: '.',
          type: 'button',
          image: 'fa-terminal',
          modal: true
        },
        settingsSync: {
          name: 'Settings Sync',
          children: {
            settingsSync: {
              name: 'Enabled',
              default: false,
              action: (state, _, key, setting) => state
                ? utils.showPassphraseModal({ key,
                  setting,
                  cancel: true })
                : null
            },
            passphrase: {
              name: 'Passphrase',
              type: 'button',
              image: 'fa-key',
              seperate: true,
              modal: true,
              disabled: (id) => !powercord.api.settings.store.getSetting(id,
                'settingsSync', false),
              action: (_, key, setting) => utils.showPassphraseModal({ key,
                setting })
            }
          },
          type: 'submenu',
          seperate: true,
          hide: () => !powercord.account
        },
        advancedSettings: {
          name: 'Advanced Settings',
          children: {
            backendURL: {
              name: 'Backend URL',
              desc: 'URL used for Spotify linking, plugin management and other internal functions.',
              default: 'https://powercord.dev',
              type: 'button',
              image: 'fa-server',
              domain: true,
              modal: {
                realtime: true,
                custom: true
              }
            },
            openOverlayDevTools: {
              name: 'Overlay DevTools',
              default: false,
              seperate: true
            },
            hideToken: {
              name: 'Keep Token Stored',
              default: true
            },
            transparentWindow: {
              name: 'Transparent Window',
              default: false
            },
            experimentalWebPlatform: {
              name: 'Experimental Web Platform',
              default: false
            },
            experiments: {
              name: 'Discord Experiments',
              default: false,
              updateHeight: true
            }
          },
          type: 'submenu',
          seperate: true
        },
        clearCache: {
          name: 'Clear Cache',
          type: 'button',
          image: 'fa-archive',
          dangerous: true,
          seperate: true,
          modal: true,
          action: (_, key) => utils.openModal(React.createElement(GenericModal, {
            red: true,
            header: 'Clear cache',
            confirmText: 'Clear Cache',
            cancelText: 'Cancel',
            onConfirm: () => require('electron').remote.getCurrentWindow().webContents.session
              .clearCache(),
            options: { key }
          }))
        }
      }
    },
    'pc-hastebin': {
      settings: {
        send: {
          name: 'Send Hastebin Link',
          default: false
        },
        domain: {
          name: 'Domain',
          desc: 'The domain used for the Hastebin server.',
          default: 'https://haste.aetheryx.xyz',
          type: 'button',
          image: 'fa-home',
          seperate: true,
          domain: true,
          modal: {
            realtime: true,
            custom: true
          }
        }
      }
    },
    'pc-spotify': {
      settings: {
        showControls: {
          name: 'Show Advanced Controls',
          default: true
        },
        noAutoPause: {
          name: 'No Auto-Pause',
          default: true,
          func: {
            method: '_patchAutoPause',
            arguments: 'state',
            type: 'pluginManager'
          }
        },
        showContextIcons: {
          name: 'Show Context Menu Icons',
          default: true
        }
      }
    },
    'pc-updater': {
      settings: {
        checkForUpdates: {
          name: 'Check for Updates',
          children: {
            checkForUpdates: {
              name: 'Receive Updates',
              default: true
            },
            checking: {
              name: 'Check Now!',
              type: 'button',
              image: 'fa-sync',
              color: '#7289da',
              seperate: true,
              action: async (id, _, setting) => {
                setting.new = {};
                setting.new.name = 'Checking...';

                setting.image = 'fa-sync fa-spin';

                powercord.pluginManager.get(id).checkForUpdate().then(() => {
                  delete setting.new;

                  setting.image = 'fa-sync';

                  utils.forceUpdate();
                });
              },
              disabled: (id) => powercord.pluginManager.get(id).checking || !powercord.api.settings
                .store.getSetting(id, 'checkForUpdates', true)
            }
          },
          type: 'submenu'
        },
        interval: {
          name: 'Update Interval',
          desc: 'How frequently Powercord checks for updates (in minutes).',
          default: '15',
          type: 'button',
          image: 'fa-clock',
          seperate: true,
          modal: true
        }
      }
    },
    quote: {
      unofficial: true,
      settings: {
        format: {
          name: 'Quote Message Format',
          default: '[auto]',
          type: 'button',
          image: 'fa-quote-left',
          modal: {
            options: [
              {
                label: '*[userMention]* • Mentions the quoted user.',
                value: '[userMention]'
              },
              {
                label: '*[userDisplayName]* • Displays the quoted user\'s display name.',
                value: '[userDisplayName]'
              },
              {
                label: '*[username]* • Displays the quoted user\'s username.',
                value: '[username]'
              },
              {
                label: '*[userID]* • Displays the quoted user\'s ID.',
                value: '[userID]'
              },
              {
                label: '*[userDiscriminator]* • Displays the quoted user\'s discriminator.',
                value: '[userDiscriminator]'
              },
              {
                label: '*[userTag]* • Displays the quoted user\'s tag (i.e. Clyde#0000).',
                value: '[userTag]'
              },
              {
                label: '*[channelMention]* • Mentions the channel of the quoted message.',
                value: '[channelMention]'
              },
              {
                label: '*[channelID]* • Displays the channel ID of the quoted message.',
                value: '[channelID]'
              },
              {
                label: '*[channelName]* • Displays the channel name of the quoted message.',
                value: '[channelName]'
              },
              {
                label: '*[guildID]* • Displays the guild ID of the quoted message.',
                value: '[guildID]'
              },
              {
                label: '*[message]* • Displays the content of the quoted message.',
                value: '[message]'
              },
              {
                label: '*[messageURL]* • Displays the URL of the quoted message.',
                value: '[messageURL]'
              },
              {
                label: '*[messageDate]* • Displays the creation date of the quoted message.',
                value: '[messageDate]'
              },
              {
                label: '*[messageTime]* • Displays the creation time of the quoted message.',
                value: '[messageTime]'
              },
              {
                label: '*[messageTimestamp]* • Displays the timestamp (an unformatted date and time) of the quoted message.',
                value: '[messageTimestamp]'
              },
              {
                label: '*[auto]* • Use the built-in format (perfect for lazy people like you! UwU).',
                value: '[auto]'
              }
            ]
          }
        }
      }
    },
    rceverywhere: {
      id: 'rolecolor-everywhere',
      unofficial: true,
      settings: {
        account: {
          name: 'Account',
          default: true
        },
        voice: {
          name: 'Voice Users',
          default: true
        },
        mentions: {
          name: 'Mentions',
          default: true
        },
        typing: {
          name: 'Typing Indicator',
          default: true
        },
        members: {
          name: 'Members List',
          default: true
        }
      }
    },
    swerve: {
      unofficial: true,
      settings: {
        words: {
          name: 'Words to Censor',
          desc: 'Delimit new words with pipes (\'|\'). Words must be longer than 3 characters.',
          placeholder: (id) => powercord.pluginManager.get(id).defaultWords.join('|'),
          default: [],
          type: 'button',
          image: 'fa-filter',
          modal: {
            realtime: true,
            custom: true
          }
        }
      }
    },
    'wallpaper-changer': {
      unofficial: true,
      settings: {
        interval: {
          name: 'Wallpaper Interval',
          default: 60,
          type: 'button',
          image: 'fa-clock',
          seperate: true,
          modal: {
            slider: {
          markers: [ 5, 10, 15, 30, 60, 120, 180, 360, 720, 3600 ],
              onMarkerRender: (value) => value < 60 ? `${value}min` : `${value / 60}hr`
            }
          },
          func: {
            method: 'updateInterval',
            type: 'pluginManager'
          }
        },
        selector: {
          name: 'Selector',
          desc: 'CSS selector where the \'background-image\' will be applied',
          default: 'body',
          type: 'button',
          image: 'fa-mouse-pointer',
          seperate: true,
          modal: true,
          func: {
            method: 'changeWallpaper',
            type: 'pluginManager'
          }
        },
        changeWallpaper: {
          name: 'Change Wallpaper',
          color: '#7289da',
          type: 'button',
          image: 'fa-redo',
          seperate: true,
          action: (id) => powercord.pluginManager.get(id).changeWallpaper()
        }
      }
    }
  }
];
