# Quick Actions — Rewritten (v2)
Adds an extensible tab to the ‘User Settings’ context menu that enables Powercord shortcuts.

## Compatibility:
Quick Actions supports a vast selection of the settings utilized by the following plugins below.

**DISCLAIMER**: Not all settings will be available due to workload and limitations - please see “[Frequently Asked Questions](https://github.com/GriefMoDz/quickActions/#frequently-asked-questions)” for more details.

| Plugin Name                | Plugin Shortcode (URI)   | Version | Official\* | Repository URL                                             |
| -------------------------- | ------------------------ |:-------:|:----------:|:----------------------------------------------------------:|
| advancedTitleBar**         | advanced-title-bar       | v1.0.0  | ⭕         | [[Link]](../../../../powercord-community/advanced-title-bar)
| ~~Alias**~~                | ~~alias~~                | ~~v1.0.3~~  | ~~⭕~~        | ~~[[Link]](../../../../powercord-community/alias)~~
| Auditory                   | auditory                 | v1.0.7  | ⭕         | [[Link]](../../../../powercord-community/auditory)
| Autoplay GIF Avatars       | autoplayGifAvatars       | v1.0.0  | ⭕         | [[Link]](../../../autoplayGifAvatars)
| Better Friends**           | betterfriends            | v3.2.1  | ⭕         | [[Link]](../../../../powercord-community/betterfriends)
| Bookmoji                   | bookmoji                 | v1.0.2  | ⭕         | [[Link]](../../../../powercord-community/bookmoji)
| Clickable Message Edits    | pc-clickableEdits        | v0.2.0  | ✔️         | n/a
| Context+                   | pc-cadence-contextPlus   | v1.1.0  | ⭕         | [[Link]](../../../../cloudrac3r/pc-cadence-contextPlus)
| Discord RPC                | discordrpc               | v1.1.0  | ⭕         | [[Link]](../../../../ohlookitsderpy/discordrpc)
| Discord Tweaks             | discord-tweaks           | v1.0.1  | ⭕         | [[Link]](../../../../NurMarvin/discord-tweaks)
| Emote Utility              | pc-emojiUtility          | v1.3.3  | ✔️         | n/a
| Hastebin                   | pc-hastebin              | v1.0.0  | ✔️         | n/a
| Helpful Utilities          | pc-helpful-utilities     | v1.0.0  | ⭕         | [[Link]](../../../../axelgreavette/pc-helpful-utilities)
| Lightify                   | lightify                 | v0.0.1  | ⭕         | [[Link]](../../../../GeoffreyWesthoff/lightify)
| Mu                         | powercord-multiuser      | v0.1.0  | ⭕         | [[Link]](../../../../halcyxn/powercord-multiuser)
| Plugin Manager             | pc-pluginManager         | v0.1.1  | ✔️         | n/a
| Plugin Updater             | powercord-plugin-updater | v1.0.7  | ⭕         | [[Link]](../../../../cloudrac3r/powercord-plugin-updater)
| Quote                      | quote                    | v1.4.2  | ⭕         | [[Link]](../../../../NurMarvin/quote)
| Role Color Everywhere      | rolecolor-everywhere     | v1.0.0  | ⭕         | [[Link]](../../../../powercord-community/rolecolor-everywhere)
| Settings API               | pc-general               | v1.0.0  | ✔️         | n/a
| Spotify Modal              | pc-spotify               | v1.1.0  | ✔️         | n/a
| Style Manager              | pc-styleManager          | v1.1.1  | ✔️         | n/a
| Swerve                     | swerve                   | v1.0.1  | ⭕         | [[Link]](../../../../Nevvulo/swerve)
| ~~Theme Development Injector~~ | ~~customa-dev-injector~~     | ~~v1.0.2~~  | ~~⭕~~        | ~~[[Link]](https://gitlab.com/Customa/customa-dev-injector)~~
| Translate                  | pc-translate             | v1.0.0  | ✔️         | n/a
| Updater                    | pc-updater               | v1.0.0  | ✔️         | n/a
| Wallpaper Changer**        | wallpaper-changer        | v1.1.0  | ⭕         | [[Link]](../../../../powercord-community/wallpaper-changer)

\*Plugin is shipped with Powercord by default (will work straight out of the box once enabled).<br/>
\**Plugin is not fully compatible with Quick Actions (some settings may be missing or left as-is).

## Usage/Instructions:
1. Right-click the ‘User Settings’ button (third icon starting from the left - the little cog) found under the “User Account Details” container.
2. Hover your cursor over the ‘Powercord’ sub-menu.

Aside from just offering shortcuts ranging from a list of other plug-ins, Quick Actions also provides some of its own built-in settings in order to help improve user experience. Here’s what we have in store so far:

- Auto Updates: controls whether or not this plug-in should automatically fetch and send prompts for updates.
- Show Descriptions: toggles the notes that are usually displayed when hovering over buttons, checkboxes and sub-menus.
- Show Hidden Plugins: toggles the visibility of plug-ins hidden from the ‘Powercord’ and ‘Installed Plugins’ sub-menu.
- Show Explore Plugins: toggles the ‘Explore Plugins’ tab found under the ‘Installed Plugins’ sub-menu.

## Installation:
Thanks to Powercord’s state of the art plug-in API, installing Quick Actions is as simple as counting from one to three and takes no more than 4 steps (legend even has it that you can do this in your sleep because of how easy it is!).

To get started, please take the time to read the steps below carefully, making sure that you follow everything exactly as shown on screen for the smoothest possible installation.

If you still happen to not be sure about something or just need some further assistance then feel free to add me on Discord @ Harley#1051.

__**Basic Installation**__
  1. Open a command prompt / terminal of your choice (e.g. CMD if you’re using Windows, or Terminal if you’re using Linux/macOS).
  2. Using `cd <POWERCORD_INSTALL_DIR>/src/Powercord/plugins`, point the terminal that you just opened to the “plugins” folder of your Powercord installation.
  3. Copy ‘n’ paste the following command `git clone https://github.com/GriefMoDz/quickActions` into the same terminal.
  4. Restart Discord (`Ctrl` + `R`) after the above command has sucessfully executed.

__**Advanced Installation**__
  1. Open your DevTools (`Ctrl` + `Shift` + `I`) and click the ‘Console’ tab.
  2. Copy ‘n’ paste the following one-liner `await require('util').promisify(exec)('git clone https://github.com/GriefMoDz/quickActions', { cwd: powercord.pluginManager.pluginDir })` into the input box.
  3. Restart Discord (`Ctrl` + `R`) or type `powercord.pluginManager.remount('quickActions')` inside the same input box from the previous step to complete the installation phase.

## Frequently Asked Questions:
1. __Help! I’m using a supported plugin from the “[Compatibility Table](https://github.com/GriefMoDz/quickActions/#compatibility)”, but I seem to be missing some settings. What do I do?__
   > ~~Due to how context menus are laid out, plugin settings are only limited to buttons, checkboxes (this includes switch items), and sliders. This means that text inputs are completely unavailable and left ignored until further notice.~~
   >
   > ~~You should still be able to quickly access the settings of a said plugin by simply selecting its corresponding sub-menu item, where you’ll be able to find and edit all kinds of text to your hearts content. c:~~
   >
   > Unfortunately, this plug-in is still heavily in beta, meaning that not all settings that you happen see in the ‘User Settings’ dialog will necessarily be found under the ‘Powercord’ sub-menu.
   >
   > This isn’t to say that no work is being done and I’m not doing anything to fix this, as I'm really trying my best and working around the clock to have most, if not all, of these settings pushed out as soon as possible.
   >
   > All that I really ask of you now is that you please be patient. Thank you!
