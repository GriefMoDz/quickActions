const { React, getModule } = require('powercord/webpack');
const { forceUpdateElement, waitFor } = require('powercord/util');
const { close: closeModal } = require('powercord/modal');
const { actions: { updateSetting } } = powercord.api.settings;
const { ImageMenuItem, SubMenuItem, ToggleMenuItem } = require('../components/ContextMenu');

const GenericModal = require('../components/Modal');

module.exports = (plugin) => [ {
  advancedTitle: {
    id: 'advanced-title-bar',
    settings: {
      limit: {
        name: 'Limit Title Bar Games',
        desc: 'Limit the amount of games displayed by "pc-titleBarGames".',
        default: 40,
        type: 'slider',
        minValue: 1,
        maxValue: 40,
        onValueRender: (value) => parseInt(value),
        onValueChange: async (id, key, value) => {
          const titleBarClasses = (await getModule([ 'titleBar' ]));
          const titleBar = `.${titleBarClasses.titleBar.replace(/ /g, '')}`;

          updateSetting(id, key, parseInt(value));
          forceUpdateElement(titleBar);

          plugin.utils.forceUpdate();
        },
        hide: () => !powercord.pluginManager.isEnabled('pc-titleBarGames') || process.platform !== 'win32'
      }
    }
  },
  auditory: {
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
        desc: 'Changing this value will change the amount of detail the visualizer\n' +
          'will pick up on, how often it updates and certain visual effects.',
        default: 1,
        type: 'slider',
        color: (id) => powercord.api.settings.store.getSetting(id, 'color', null),
        seperate: true,
        markers: [ 1, 2, 3, 4, 5 ],
        onValueChange: (id, key, value) => {
          updateSetting(id, key, parseInt(value));

          powercord.pluginManager.get(id).reload();

          plugin.utils.forceUpdate();
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

          plugin.utils.forceUpdate();
        }
      },
      important: {
        name: 'Override Styling',
        desc: 'This ensures that Auditory styling and effects take priority\n' +
          'over themes and other CSS that affect the user container.',
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
        image: 'fa-stop-circle-regular',
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
    settings: {
      'hu-cmd-trbmb': {
        name: 'Toggle TRBMB Command',
        default: false
      },
      'hu-cmd-id': {
        name: 'Toggle ID Command',
        default: false
      }
    }
  },
  betterfriends: {
    settings: {
      infomodal: {
        name: 'Show Information Modal',
        desc: 'Toggles the functionality of the information button\nwithin the DM list on favorited friends.',
        default: true,
        func: {
          method: 'reload',
          arguments: 'InformationModal',
          type: 'pluginManager'
        }
      },
      displaystar: {
        name: 'Display Star',
        desc: 'Display a star next to favorited friends.',
        default: true,
        func: {
          method: 'reload',
          arguments: 'DisplayStar',
          type: 'pluginManager'
        }
      },
      statuspopup: {
        name: 'Show Status Notifications',
        desc: 'Receive notifications in the bottom right-hand corner\nwhenever a favorited friend changes their status.',
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
    settings: {
      patchUser: {
        name: 'User Context Menu',
        desc: 'Removes call, note, activity feed, watch\nstream. Moves invite, add friend, block.',
        default: true
      },
      patchGuild: {
        name: 'Guild Context Menu',
        desc: 'Removes hide muted channels, privacy\nsettings, change nickname, channel creation.',
        default: true
      }
    }
  },
  lightify: {
    settings: {
      YeeLight: {
        name: 'YeeLight',
        desc: 'Use YeeLight lights with Lightify.',
        default: false
      },
      Lifx: {
        name: 'Lifx',
        desc: 'Use Lifx lights with Lightify.',
        default: false
      },
      AutoOn: {
        name: 'Auto-On',
        desc: 'Turn on the light if the light is off.',
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
        desc: 'Set the brightness of the YeeLight light when it\'s pulsed.',
        default: 100,
        type: 'slider',
        seperate: true,
        onValueChange: (id, key, value) => {
          updateSetting(id, key, parseInt(value));

          plugin.utils.forceUpdate();
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
        desc: 'Set the time the light needs to stay the\nmention color for when you are mentioned.',
        default: 250,
        type: 'slider',
        seperate: true,
        maxValue: 60000,
        onValueRender: (value) => `${parseFloat(value / 1000).toFixed(2)}s`,
        onValueChange: (id, key, value) => {
          updateSetting(id, key, parseInt(value));

          plugin.utils.forceUpdate();
        }
      }
    }
  },
  mu: {
    id: 'powercord-multiuser',
    settings: {
      users: {
        name: 'Users',
        displayCounter: true,
        children: (id, key) => {
          const children = [];
          const users = powercord.api.settings.store.getSetting(id, key, []);

          users.map(user => {
            const child = React.createElement(ImageMenuItem, {
              label: user.nickname || 'Untitled',
              seperated: true,
              modal: true,
              action: () => plugin.utils.openModal(React.createElement(GenericModal, {
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
        action: (id, _, setting, name) => plugin.utils.openModal(React.createElement(GenericModal, {
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
        desc: 'Provides the ability to use the ‘shift’ key and primary button to perform cleared message edits while also being\n' +
          'able to double-click the primary button to edit messages normally (without the removable of content).',
        default: false
      },
      rightClickEdits: {
        name: 'Swap Primary Button',
        desc: 'Sets the right mouse button (RMB) as the\nprimary control for performing message edits.',
        default: false
      },
      clearContent: {
        name: 'Clear Content',
        desc: 'Removes the message content upon editing (not sure why\nyou\'d have this enabled, but it\'s there if you ever need it).',
        default: false,
        disabled: (id) => powercord.api.settings.store.getSetting(id,
          'dualControlEdits', false)
      },
      useShiftKey: {
        name: 'Use Shift Key',
        desc: 'Makes it so that the ‘shift’ key must be held down before clicking the left or right mouse button to initiate an edit.\n' +
          '**HEADS UP**: Having this setting disabled will result in double-click edits by default. Don\'t say I didn\'t tell you.',
        default: false,
        disabled: (id) => powercord.api.settings.store.getSetting(id,
          'dualControlEdits', false)
      }
    }
  },
  'pc-cadence-pluginUpdater': {
    settings: {
      pluginDirectory: {
        name: 'Plugin Directory',
        type: 'button',
        image: 'fa-folder-open',
        modal: true,
        action: (_, __, ___, name) => plugin.utils.openModal(React.createElement(GenericModal, {
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
            onClick: () => plugin.utils.openFolder(powercord.pluginManager.pluginDir)
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
          plugin.utils.showCategory(id);

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
    official: false,
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
        desc: 'Settings for the Discord RPC text.',
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
        desc: 'Settings for the Discord RPC images.',
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
        desc: 'Timestamp for the Discord RPC.',
        default: false,
        seperate: true
      },
      commandsEnabled: {
        name: 'Use Commands',
        desc: 'Enable/Disable the commands for controlling the Discord RPC.',
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
        desc: 'Whether Emote Utility should return responses in embeds.',
        default: false
      },
      displayLink: {
        name: 'Display Link',
        desc: 'Whether the message for the "findemote" command\nshould contain the link to the guild the emote is in.',
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
        desc: 'Whether saving emotes should contain the ID of the\nemote. This prevents overwriting old saved emotes.',
        default: true,
        seperate: true
      },
      defaultCloneIdUseCurrent: {
        name: 'Use Current Server when Cloning Emotes',
        desc: 'Whether the default server for cloning emotes\nshould be the server you are currently in.',
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
        desc: 'Hide emotes from some servers. They won\'t\nshow up in emote picker, except in searches.',
        children: (id, key) => {
          const children = [];
          const hiddenGuilds = powercord.api.settings.store.getSetting(id, key, []);

          plugin.state.sortedGuildsStore.getSortedGuilds().map(guild => {
            let child;
            const { guilds } = guild;

            if (guild.folderId) {
              const servers = [];

              guilds.map(server =>
                servers.push(React.createElement(ToggleMenuItem, {
                  label: server.name,
                  active: hiddenGuilds.includes(server.id),
                  action: () => plugin.utils.handleGuildToggle(server.id)
                }))
              );

              child = React.createElement(SubMenuItem, {
                label: `${guild.folderName} (${servers.length})`,
                invertChildY: true,
                seperated: true,
                render: servers
              });
            } else {
              child = React.createElement(ToggleMenuItem, {
                label: guilds[0].name,
                active: hiddenGuilds.includes(guilds[0].id),
                action: () => plugin.utils.handleGuildToggle(guilds[0].id),
                seperated: children.length > 0 && children[children.length - 1].type.name === 'NewSubMenuItem'
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
            desc: 'Sync all of your Powercord settings across devices.',
            default: false,
            action: (state, _, key, setting) => state
              ? plugin.utils.showPassphraseModal({ key,
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
            action: (_, key, setting) => plugin.utils.showPassphraseModal({ key,
              setting })
          }
        },
        type: 'submenu',
        seperate: true,
        hide: () => !powercord.account
      },
      advancedSettings: {
        name: 'Advanced Settings',
        desc: 'Exercise caution changing anything in this category\nif you don\'t know what you\'re doing. **Seriously**.',
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
            desc: 'Should Powercord open overlay devtools when it\ngets injected? (useful for developing themes).',
            default: false,
            seperate: true
          },
          hideToken: {
            name: 'Keep Token Stored',
            desc: 'Prevents Discord from removing your token from\nlocalStorage, reducing the number of unwanted logouts.',
            default: true
          },
          transparentWindow: {
            name: 'Transparent Window',
            desc: 'Makes any windows opened by Discord transparent, useful for themeing.\n' +
              '**WARNING**: This will break **window snapping** on Windows. **Hardware\nacceleration** must be turned **off** on Linux. ' +
              'You may encounter issues and have\nblack background in some cases, like when the window is cut off at the top or the bottom\n' +
              'due to monitor resolution or when devtools are open and docked. **Requires a restart**.',
            default: false
          },
          experimentalWebPlatform: {
            name: 'Experimental Web Platform',
            desc: 'Enables Chromium\'s experimental Web Platform features that are in development,\n' +
              'such as CSS `backdrop-filter`. Since features are in development you may\n' +
              'encounter issues and APIs may change at any time. **Requires a restart**.',
            default: false
          },
          experiments: {
            name: 'Discord Experiments',
            desc: '**WARNING**: Enabling this gives you access to features that can be **detected by Discord** \n' +
              'and may result in an **account termination**. Powercord is **not responsible** for what you\n' +
              'do with this feature. Leave it disabled if you are unsure. The Powercord Team will not provide\n' +
              'support regarding any experiment.',
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
        action: (_, key) => plugin.utils.openModal(React.createElement(GenericModal, {
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
        desc: 'Whether the Hastebin link is sent in chat by default or not.',
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
        desc: 'Adds shuffle, repeat and other controls to the Spotify modal. Increases the\n' +
          'height if enabled, if not these controls are available in the context menu.',
        default: true
      },
      noAutoPause: {
        name: 'No Auto-Pause',
        desc: 'Prevents Discord from automatically pausing Spotify\n' +
          'playback if you\'re sending voice for more than 30 seconds.',
        default: true,
        func: {
          method: '_patchAutoPause',
          arguments: 'state',
          type: 'pluginManager'
        }
      },
      showContextIcons: {
        name: 'Show Context Menu Icons',
        desc: 'Adds icons next to first glace buttons and replaces hints found under the\n' +
          '\'Devices\' sub-menu with corresponding icons based on the device(s) in-use.',
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
            desc: 'Whether Powercord should check for updates.',
            default: true
          },
          checking: {
            name: 'Check Now!',
            type: 'button',
            image: 'fa-sync',
            color: '#7289da',
            seperate: true,
            action: async (id, _, __, ___, state) => {
              const { label, image } = state;

              const loading = setInterval(() => {
                if (state.label.length > 9) {
                  state.label = 'Checking';
                } else {
                  state.label += '.';
                }

                plugin.utils.forceUpdate();
              }, 250);

              state.image = 'fa-sync fa-spin';

              powercord.pluginManager.get(id).checkForUpdate().then(() => {
                clearInterval(loading);

                state.label = label;
                state.image = image;

                plugin.utils.forceUpdate();
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
  [plugin.pluginID]: {
    settings: {
      autoupdates: {
        name: 'Auto Updates',
        children: {
          autoupdates: {
            name: 'Enabled',
            default: true,
            action: (state) => {
              const announcements = powercord.pluginManager.get('pc-announcements');
              if (announcements) {
                if (state) {
                  const dismissedNotices = powercord.api.settings.store.getSetting('pc-announcements', 'dismissed', []);
                  dismissedNotices.splice(dismissedNotices.indexOf('quickActions-pending-update'), 1);

                  powercord.api.settings.actions.updateSetting('pc-announcements', 'dismissed', dismissedNotices);
                } else {
                  announcements.closeNotice('quickActions-pending-update');
                }
              }
            }
          },
          checkForUpdates: {
            name: 'Check Now!',
            type: 'button',
            image: 'fa-sync',
            color: '#7289da',
            seperate: true,
            action: async (_, __, ___, ____, state) => {
              const { label, image } = state;

              const loading = setInterval(() => {
                if (state.label.length > 9) {
                  state.label = 'Checking';
                } else {
                  state.label += '.';
                }

                plugin.utils.forceUpdate();
              }, 250);

              state.image = 'fa-sync fa-spin';

              plugin.utils.checkForUpdates().then(() => {
                clearInterval(loading);

                state.label = label;
                state.image = image;

                plugin.utils.forceUpdate();
              });
            },
            disabled: () => !plugin.settings.get('autoupdates', true)
          }
        },
        type: 'submenu',
        hide: () => !require('fs').existsSync(require('path').join(powercord.pluginManager.pluginDir, `${plugin.pluginID}/.git`))
      },
      appearance: {
        name: 'Appearance',
        children: {
          showDescriptions: {
            name: 'Show Descriptions',
            default: true
          },
          showHiddenPlugins: {
            name: 'Show Hidden Plugins',
            default: false
          },
          showExplorePlugins: {
            name: 'Show Explore Plugins',
            default: true
          }
        },
        type: 'submenu'
      }
    }
  },
  quote: {
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
    settings: {
      account: {
        name: 'Account',
        desc: 'Should your username in account box be colored.',
        default: true
      },
      voice: {
        name: 'Voice Users',
        desc: 'Should usernames in voice channels be colored.',
        default: true
      },
      mentions: {
        name: 'Mentions',
        desc: 'Should mentions in chat be colored.',
        default: true
      },
      typing: {
        name: 'Typing Indicator',
        desc: 'Should typing indicator be colored.',
        default: true
      },
      members: {
        name: 'Members List',
        desc: 'Should role names in member list be colored.',
        default: true
      }
    }
  },
  swerve: {
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
} ];
