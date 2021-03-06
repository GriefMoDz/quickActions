const { React, getModule, contextMenu } = require('powercord/webpack');
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
          const titleBar = `.${titleBarClasses.titleBar.split(' ')[0]}`;

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
          'will pick up on, how often it updates and certain visual effects.\n' +
          'Higher values may increase CPU usage.',
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
        icon: 'eye-duotone',
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
        icon: 'stop-circle-duotone',
        default: '#202225',
        modal: {
          colorPicker: true
        },
        func: {
          method: 'reload',
          type: 'pluginManager'
        }
      },
      pds: {
        name: 'PDS Mode',
        desc: 'Party and don\'t stop (quite CPU intensive).',
        default: false,
        seperate: true,
        func: {
          method: 'reload',
          type: 'pluginManager'
        }
      }
    }
  },
  autoplayGifAvatars: {
    settings: {
      account: {
        name: 'Account',
        children: {
          account: {
            name: 'Autoplay Avatar',
            desc: 'If available, should your animated avatar autoplay in the account details container?',
            default: true,
            func: {
              method: 'reload',
              type: 'pluginManager',
              arguments: 'accountAvatars'
            }
          }
        },
        type: 'submenu'
      },
      chat: {
        name: 'Chat',
        children: {
          chat: {
            name: 'Autoplay Chat',
            desc: 'Should animated avatars for Nitro users autoplay in the chat area?',
            default: true,
            func: {
              method: 'reload',
              type: 'pluginManager',
              arguments: 'chatAvatars'
            }
          }
        },
        type: 'submenu'
      },
      home: {
        name: 'Home',
        children: {
          home: {
            name: 'Autoplay Avatars',
            desc: 'Should animated avatars for Nitro users autoplay in the home/direct messages page?',
            default: true,
            func: {
              method: 'reload',
              type: 'pluginManager',
              arguments: 'home'
            }
          }
        },
        type: 'submenu'
      },
      memberList: {
        name: 'Member List',
        children: {
          'memberList-avatars': {
            name: 'Autoplay Avatars',
            desc: 'Should animated avatars for Nitro users autoplay in the member list?',
            default: true,
            func: {
              method: 'reload',
              type: 'pluginManager',
              arguments: 'memberList'
            }
          },
          'memberList-statuses': {
            name: 'Autoplay Statuses',
            desc: 'Should animated emojis on custom statuses autoplay in the member list?',
            default: true,
            func: {
              method: 'reload',
              type: 'pluginManager',
              arguments: 'memberList'
            }
          }
        },
        type: 'submenu'
      },
      guildList: {
        name: 'Guild List',
        children: {
          guildList: {
            name: 'Autoplay Icons',
            desc: 'Should animated guild icons for boosted servers autoplay in the guild list?',
            default: true,
            func: {
              method: 'reload',
              type: 'pluginManager',
              arguments: 'guildList'
            }
          }
        },
        type: 'submenu'
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
          type: 'pluginManager'
        }
      }
    }
  },
  bookmoji: {
    settings: {
      storedEmojis: {
        name: 'Bookmarked Emojis',
        desc: 'Here you can select which emojis you want to appear\nin the \'Bookmarked\' section of the emoji picker.',
        children: (id, key) => {
          const children = [];

          plugin.stores.sortedGuildsStore.getFlattenedGuilds().map(guild => {
            let storedEmojis = powercord.api.settings.store.getSetting(id, key, []);
            const emojis = Object.values(plugin.stores.emojiStore.getGuilds()).flatMap(g => g.emojis)
              .filter(emoji => emoji.guildId === guild.id);

            if (emojis.length) {
              return children.push(React.createElement(SubMenuItem, {
                label: guild.name,
                render: emojis.map(emoji =>
                  React.createElement(ImageMenuItem, {
                    label: emoji.allNamesString,
                    image: emoji.url,
                    styles: { color: storedEmojis.find(storedEmoji => storedEmoji.id === emoji.id) ? '#43b581' : '' },
                    action: () => {
                      if (storedEmojis.find(storedEmoji => storedEmoji.id === emoji.id)) {
                        storedEmojis = storedEmojis.filter(storedEmoji => storedEmoji.id !== emoji.id);
                      } else {
                        storedEmojis.push(emoji);
                      }

                      updateSetting(id, key, storedEmojis);

                      plugin.utils.forceUpdate();
                    }
                  }))
              }));
            }

            return children;
          });

          return children;
        },
        type: 'submenu'
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
  'discord-tweaks': {
    settings: {
      hideHelpButton: {
        name: 'Hide Help Button',
        desc: 'When toggled, the help button in the top right corner will not be shown.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'hide-help-button',
          type: 'pluginManager'
        }
      },
      linedCategories: {
        name: 'Lined Categories',
        desc: 'When toggled, categories will be centered and have lines next to them.\n' +
          '**NOTE**: This will most definitely break if you use a custom theme.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'lined-categories',
          type: 'pluginManager'
        }
      },
      darkEmojiPicker: {
        name: 'Dark Emoji Picker',
        desc: 'When toggled, the emoji picker will be dark themed.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'dark-emoji-picker',
          type: 'pluginManager'
        }
      },
      hideBlockedUserMessages: {
        name: 'Hide Blocked User Messages',
        desc: 'When toggled, messages from blocked users will not be shown.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'hide-blocked-user-messages',
          type: 'pluginManager'
        }
      },
      rainbowMentions: {
        name: 'Rainbow Mentions',
        desc: 'When toggled, mentions have a rainbow gradient in the background.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'rainbow-mentions',
          type: 'pluginManager'
        }
      },
      alwaysShowMessageTimestamps: {
        name: 'Always Show Message Timestamps',
        desc: 'When toggled, message timestamps are always shown.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'always-show-message-timestamps',
          type: 'pluginManager'
        }
      },
      hideLibraryButton: {
        name: 'Hide Library Button',
        desc: 'When toggled, the library button under the home tab will not be shown.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'hide-library-button',
          type: 'pluginManager'
        }
      },
      scrollableUserPanels: {
        name: 'Scrollable User Panels',
        desc: 'When toggled, user panels are scrollable.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'scrollable-user-panels',
          type: 'pluginManager'
        }
      },
      scrollableCodeBlocks: {
        name: 'Scrollable Code Blocks',
        desc: 'When toggled, code blocks are scrollable.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'scrollable-code-blocks',
          type: 'pluginManager'
        }
      },
      hideBoostIconUnlessHovering: {
        name: 'Hide Nitro Boost Icon Unless Hovering',
        desc: 'When toggled, the Nitro boost will not be\nshown unless you hover over the guild name.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'hide-boost-icon-unless-hovering',
          type: 'pluginManager'
        }
      },
      showFullRoleNames: {
        name: 'Show Full Role Names',
        desc: 'When toggled, role names in the\nuser list on the right are fully shown.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'show-full-role-names',
          type: 'pluginManager'
        }
      },
      moreObviousGuildSpeaker: {
        name: 'More Obvious Guild Speaker',
        desc: 'When toggled, the guild speaker icon is a little better to see.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'more-obvious-guild-speaker',
          type: 'pluginManager'
        }
      },
      rearrangedSearchbar: {
        name: 'Rearranged Searchbar',
        desc: 'When toggled, the searchbar is rearranged to the\nfar right and hides the other button during search.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'rearranged-searchbar',
          type: 'pluginManager'
        }
      },
      largerProfileAvatars: {
        name: 'Larger Profile Avatars',
        desc: 'When toggled, user avatars in the\nuser popouts become a little bit bigger.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'larger-profile-avatars',
          type: 'pluginManager'
        }
      },
      hideGiftButton: {
        name: 'Hide Gift Button',
        desc: 'When toggled, the gift button in the\ntext field next to GIF will not be shown.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'hide-gift-button',
          type: 'pluginManager'
        }
      },
      compactExtraButtons: {
        name: 'Compact Extra Buttons',
        desc: 'When toggled, message buttons that are added by other plugins like\n' +
          'Star, Quick React or Quote will be shown in a compact list when hovered.',
        default: false,
        func: {
          method: 'toggleTweak',
          arguments: 'compact-extra-buttons',
          type: 'pluginManager'
        }
      },
      hideDisabledEmojis: {
        name: 'Hide Disabled Emojis',
        desc: 'When toggled, hides disabled emojis in emoji picker.',
        default: false,
        func: {
          method: 'toggleTweakJS',
          arguments: 'hide-disabled-emojis',
          type: 'pluginManager'
        }
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
        icon: 'globe-duotone',
        default: '192.168.0.100',
        seperate: true,
        modal: true
      },
      LifxName: {
        name: 'Lifx Device Name',
        desc: 'Enter the device name of the Lifx lamp you want to pulse!',
        type: 'button',
        icon: 'id-badge-duotone',
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
        icon: 'palette-duotone',
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
  morebadges: {
    settings: {
      messages: {
        name: 'Messages',
        desc: 'Display badges in chat messages.',
        default: true
      },
      members: {
        name: 'Member List',
        desc: 'Display badges in the list of members.',
        default: true
      },
      dms: {
        name: 'DM Channels List',
        desc: 'Display badges in the list of DMs.',
        default: true
      },
      displayedBadges: {
        name: 'Displayed Badges',
        desc: 'Hide some badges you don\'t care about.',
        seperate: true,
        children: {
          displayStaff: {
            name: 'Discord Staff',
            default: true
          },
          displayPartner: {
            name: 'Discord Partner',
            default: true
          },
          displayHypeSquad: {
            name: 'Discord HypeSquad (Events)',
            default: true
          },
          displayHypeSquadOnline: {
            name: 'Discord HypeSquad (Houses)',
            default: true
          },
          displayHunter: {
            name: 'Bug Hunter',
            default: true
          },
          displayEarly: {
            name: 'Early Supporter',
            default: true
          },
          displayNitro: {
            name: 'Discord Nitro',
            default: true
          },
          displayBoosting: {
            name: 'Nitro Boosting',
            default: true
          }
        },
        type: 'submenu'
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
              seperated: users.indexOf(user) !== 0,
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
        icon: 'user-plus-duotone',
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
  'pc-discordrpc': {
    official: false,
    settings: {
      clientid: {
        name: 'Client ID',
        desc: 'ID used to start the Discord RPC.',
        type: 'button',
        icon: 'id-card-duotone',
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
            icon: 'edit-duotone',
            default: 'Hello!',
            required: true,
            modal: true
          },
          linetwo: {
            name: 'Line Two',
            desc: 'Second line of the Discord RPC.',
            type: 'button',
            icon: 'edit-duotone',
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
          largeicon: {
            name: 'Large Image',
            desc: 'Large image shown on the Discord RPC.',
            type: 'button',
            icon: 'image-polaroid-duotone',
            modal: true
          },
          largeimagetext: {
            name: 'Large Image Text',
            desc: 'Text shown when hovering over the large image.',
            type: 'button',
            icon: 'edit-duotone',
            modal: true
          },
          smallicon: {
            name: 'Small Image',
            desc: 'Small image shown on the Discord RPC.',
            type: 'button',
            icon: 'image-duotone',
            modal: true
          },
          smallimagetext: {
            name: 'Small Image Text',
            desc: 'Text shown when hovering over the small image.',
            type: 'button',
            icon: 'edit-duotone',
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
        icon: 'save-duotone',
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
        icon: 'hdd-duotone',
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

          plugin.stores.sortedGuildsStore.getSortedGuilds().map(guild => {
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
                seperated: children.length > 0 && children[children.length - 1].type.name === 'NewToggleMenuItem',
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
        icon: 'terminal-duotone',
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
            icon: 'key-duotone',
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
      aprilFools: {
        name: 'April Fools',
        desc: 'Disabling this makes you 10x less cool. :(',
        default: true,
        seperate: true
      },
      replaceClyde: {
        name: 'Eradicate Clyde',
        desc: 'Replaces Clyde in Powercord commands with a mixed range of avatars and\n' +
        'usernames selected by plug-in developers - fallbacks to "Powercord" by default.',
        default: true
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
            icon: 'server-duotone',
            domain: true,
            modal: {
              realtime: true,
              custom: true
            }
          },
          yeetSelfXSS: {
            name: 'Disable Self-XSS Warning',
            desc: 'Prevents Discord from showing a warning message when opening devtools.',
            default: false,
            seperate: true
          },
          openOverlayDevTools: {
            name: 'Overlay DevTools',
            desc: 'Should Powercord open overlay devtools when it\ngets injected? (useful for developing themes).',
            default: false,
            disabled: true
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
            default: false,
            dangerous: true,
            action: (state) => state ? plugin.utils.showRestartModal() : null
          },
          experimentalWebPlatform: {
            name: 'Experimental Web Platform',
            desc: 'Enables Chromium\'s experimental Web Platform features that are in development,\n' +
              'such as CSS `backdrop-filter`. Since features are in development you may\n' +
              'encounter issues and APIs may change at any time. **Requires a restart**.',
            default: false,
            dangerous: true,
            action: (state) => state ? plugin.utils.showRestartModal() : null
          },
          experiments: {
            name: 'Discord Experiments',
            desc: '**WARNING**: Enabling this gives you access to features that can be **detected by Discord** \n' +
              'and may result in an **account termination**. Powercord is **not responsible** for what you\n' +
              'do with this feature. Leave it disabled if you are unsure. The Powercord Team will not provide\n' +
              'support regarding any experiment.',
            default: false,
            dangerous: true,
            updateHeight: true
          }
        },
        type: 'submenu',
        seperate: true
      },
      clearCache: {
        name: 'Clear Cache',
        type: 'button',
        icon: 'archive-duotone',
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
        default: 'https://haste.powercord.dev',
        type: 'button',
        icon: 'home-lg-duotone',
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
  'pc-translate': {
    settings: {
      sortByUsage: {
        name: 'Prioritize Languages by Usage',
        desc: 'Move most frequently used languages to the top of the\n' +
          'list and leave the rest that remain in alphabetical order.',
        default: false
      },
      hiddenLanguages: {
        name: 'Hidden Languages',
        desc: 'Here you can decide which of the languages are\n' +
          'to be hidden from the "Translate" sub-menu.',
        children: (id, key) => {
          const children = [];
          const translate = require('google-translate-api');
          const hiddenLanguages = powercord.api.settings.store.getSetting(id, key, []);
          const languages = powercord.pluginManager.get(id).state.languages.filter(lang => lang !== 'auto');

          languages.map(lang =>
            children.push(React.createElement(ToggleMenuItem, {
              label: translate.languages[lang],
              active: hiddenLanguages.includes(lang),
              seperated: children.length < 1,
              action: () => updateSetting(id, key, !hiddenLanguages.includes(lang)
                ? [ ...hiddenLanguages, lang ]
                : hiddenLanguages.filter(hiddenLang => hiddenLang !== lang))
            }))
          );

          children.splice(0, 0, React.createElement(ImageMenuItem, {
            label: `${hiddenLanguages.length >= languages.length ? 'Show' : 'Hide'} All Languages`,
            icon: `${hiddenLanguages.length >= languages.length ? 'eye-duotone' : 'eye-slash-duotone'}`,
            styles: { color: '#7289da' },
            action: (component) => {
              const { state: { props } } = component;

              if (hiddenLanguages.length >= languages.length) {
                updateSetting(id, key, []);

                props.label = 'Hide All Languages';
                props.icon = 'eye-slash-duotone';
              } else {
                updateSetting(id, key, languages);

                props.label = 'Show All Languages';
                props.icon = 'eye-duotone';
              }

              return plugin.utils.forceUpdate();
            }
          }));

          return children;
        },
        type: 'submenu',
        seperate: true
      }
    }
  },
  'pc-updater': {
    settings: {
      checking: {
        name: 'Check Now!',
        type: 'button',
        icon: 'sync-alt-duotone',
        color: '#43b581',
        seperate: true,
        action: async (id, _, __, ___, component) => {
          const { state: { props } } = component;
          const { label, icon } = props;

          props.label = 'Checking';

          const loading = setInterval(() => {
            if (props.label.length > 10) {
              props.label = 'Checking';
            } else {
              props.label += '.';
            }

            plugin.utils.forceUpdate();
          }, 250);

          props.icon = 'sync-alt-duotone fa-spin';

          powercord.pluginManager.get(id).checkForUpdates(null, true).then(async () => {
            const { playSound } = (await getModule([ 'playSound' ]));

            clearInterval(loading);

            if (document.getElementById('powercord-updater')) {
              props.label = 'Updates Available!';

              playSound('stream_started', 0.25);
            } else {
              props.label = 'Already Up-to-Date!';
            }

            props.icon = icon;

            plugin.utils.forceUpdate();

            setTimeout(() => {
              props.label = label;

              plugin.utils.forceUpdate();
            }, 5e3);
          });
        },
        disabled: (id) => powercord.api.settings.store.getSetting(id,
          'disabled', false) || powercord.api.settings.store.getSetting(id,
          'paused', false)
      },
      options: {
        name: 'Options',
        seperate: true,
        children: {
          automatic: {
            name: 'Update Automatically',
            desc: 'Powercord can download and install updates in background\n' +
            'without annoying you too much. Note that updates will require\n' +
            'user action if a reload is required, or if there is a conflict.',
            default: false,
            seperate: true
          },
          interval: {
            name: 'Update Check Interval',
            desc: 'How frequently Powercord will check for updates (in minutes). Minimum 10 minutes.',
            default: 15,
            type: 'button',
            icon: 'alarm-clock-duotone',
            seperate: true,
            modal: {
              validate: true,
              realtime: true
            }
          },
          concurrency: {
            name: 'Update Concurrency Limit',
            desc: 'How many concurrent tasks Powercord will run in background\n' +
              'to check for updates. Minimum 1. If unsure, leave 2.',
            default: 2,
            type: 'button',
            icon: 'exchange-duotone',
            modal: {
              validate: true,
              realtime: true
            }
          },
        },
        type: 'submenu',
        hide: (id) => powercord.api.settings.store.getSetting(id,
          'disabled', false)
      },
      openChangeLog: {
        name: 'Open Change Log',
        desc: 'Missed the changelog, or want to see it again?',
        type: 'button',
        icon: 'file-search-duotone',
        color: '#7289da',
        seperate: true,
        action: (id) => {
          powercord.pluginManager.get(id).openChangeLogs();
          contextMenu.closeContextMenu();
        }
      },
      changeReleaseChannel: {
        name: 'Change Release Channel',
        desc: 'You can choose between the stable branch, or the\n' +
        'development branch. Stable branch will only get major\n' +
        'updates, security and critical updates. If unsure, stay on stable.',
        children: (id) => {
          const children = [];
          const { branch } = powercord.gitInfos;

          children.push(React.createElement(ImageMenuItem, {
            label: `Switch to ${branch === 'v2' ? 'Dev' : 'Stable'}`,
            hint: branch === 'v2' ? 'Stable' : 'Dev',
            danger: true,
            seperate: true,
            action: () => plugin.utils.openModal(React.createElement(GenericModal, {
              red: true,
              header: `Change release channel to '${branch === 'v2' ? 'v2-dev' : 'v2'}'`,
              desc: 'Are you sure you want to change your release channel? Powercord will reload your Discord client.',
              confirmText: `Switch to "${branch === 'v2' ? 'v2-dev' : 'v2'}"`,
              cancelText: 'Cancel',
              onConfirm: () => powercord.pluginManager.get(id).changeBranch(branch === 'v2' ? 'v2-dev' : 'v2')
            }))
          }));

          return children;
        },
        type: 'submenu',
        seperate: true
      }
    }
  },
  'powercord-plugin-updater': {
    id: 'pc-plugin-updater',
    settings: {
      pluginDirectory: {
        name: 'Plugin Directory',
        type: 'button',
        icon: 'folder-tree-duotone',
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
        icon: 'cogs-duotone',
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
  'powercord-quick-react': {
    id: 'pc-quick-react',
    settings: {
      emojis: {
        name: 'Emoji List',
        displayCounter: true,
        children: (id, key) => {
          const children = [];
          const emojis = powercord.api.settings.store.getSetting(id, key, []);

          if (emojis.length < 1) {
            children.push(React.createElement(ImageMenuItem, {
              label: 'No Emojis Found!',
              image: powercord.pluginManager.get(id).nameToURL('japanese_goblin')
            }));
          }

          emojis.map(name => {
            const child = React.createElement(ImageMenuItem, {
              label: `:${name}:`,
              image: powercord.pluginManager.get(id).nameToURL(name),
              styles: { color: emojis.find(n => n === name) ? '#43b581' : '' },
              action: () => {
                powercord.pluginManager.get(id).emojis = emojis.filter(n => n !== name);
                powercord.pluginManager.get(id).saveSettings();
                powercord.pluginManager.get(id).forceUpdate();

                plugin.utils.forceUpdate();
              }
            });

            return children.push(child);
          });

          return children;
        },
        type: 'submenu'
      },
      addEmoji: {
        name: 'Add New Emoji',
        icon: 'smile-plus-duotone',
        type: 'button',
        modal: {
          realtime: true,
          custom: true
        },
        disabled: true,
        seperate: true
      }
    }
  },
  [plugin.entityID]: {
    settings: {
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
          },
          showExploreThemes: {
            name: 'Show Explore Themes',
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
        icon: 'quote-left-duotone',
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
      },
      status: {
        name: 'Status',
        desc: 'Should user statuses in member list be colored.',
        default: true
      },
      messages: {
        name: 'Messages',
        desc: 'Should messages be colored.',
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
        icon: 'filter-duotone',
        modal: {
          realtime: true,
          custom: true
        }
      }
    }
  },
  ucbadges: {
    settings: {
      ignoreMutedChannels: {
        name: 'Ignore Muted Channels',
        default: false
      }
    }
  },
  'wallpaper-changer': {
    settings: {
      source: {
        name: 'Wallhaven',
        default: 0,
        type: 'button',
        hint: 'MAN',
        color: '#43b581',
        newValue: 1,
        new: {
          name: 'Manual',
          hint: 'WH'
        }
      },
      wallhaven: {
        name: 'Wallhaven Settings',
        children: {
          'wallhaven-search': {
            name: 'Search Terms',
            desc: 'What the plugin will use to find wallpapers.',
            type: 'button',
            icon: 'search-duotone',
            modal: true
          },
          'wallhaven-key': {
            name: 'API Key',
            desc: 'An API key is required to get NSFW wallpapers, kinky boi. You can find it in your settings.',
            type: 'button',
            icon: 'key-duotone',
            seperate: true,
            modal: true
          },
          'wallhaven-c-gen': {
            name: 'Category: General',
            desc: 'Includes wallpapers categorized as General.',
            default: true,
            seperate: true
          },
          'wallhaven-c-weeb': {
            name: 'Category: Anime',
            desc: 'Includes wallpapers categorized as Anime.',
            default: true
          },
          'wallhaven-c-ppl': {
            name: 'Category: People',
            desc: 'Includes wallpapers categorized as People.',
            default: true
          },
          'wallhaven-p-sfw': {
            name: 'Purity: SFW',
            desc: 'Includes wallpapers categorized as Safe for Work.',
            default: true
          },
          'wallhaven-p-uwu': {
            name: 'Purity: Sketchy',
            desc: 'Includes wallpapers categorized as Sketchy.',
            default: false
          },
          'wallhaven-p-nsfw': {
            name: 'Purity: NSFW',
            desc: 'Includes wallpapers categorized as Not Safe for Work. kinky boy. Requires an API key.',
            default: false,
            disabled: (id) => !powercord.api.settings.store.getSetting(id, 'wallhaven-key', '')
          }
        },
        type: 'submenu',
        seperate: true,
        hide: (id) => powercord.api.settings.store.getSetting(id, 'source', 0) !== 1
      },
      interval: {
        name: 'Wallpaper Interval',
        default: 60,
        type: 'button',
        icon: 'alarm-clock-duotone',
        seperate: true,
        static: true,
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
        desc: 'CSS selector where the \'background-image\' will be applied.',
        default: 'body',
        type: 'button',
        icon: 'hand-pointer-duotone',
        seperate: true,
        static: true,
        modal: true,
        func: {
          method: 'changeWallpaper',
          type: 'pluginManager'
        }
      },
      changeWallpaper: {
        name: 'Change Wallpaper',
        desc: 'Triggers a wallpaper change. This won\'t affect interval.',
        color: '#7289da',
        type: 'button',
        icon: 'arrow-circle-right-duotone',
        seperate: true,
        static: true,
        action: (id) => powercord.pluginManager.get(id).changeWallpaper()
      }
    }
  }
} ];
