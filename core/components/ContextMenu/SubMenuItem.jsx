const { AsyncComponent } = require('powercord/components');
const { React, getModule, getModuleByDisplayName, contextMenu, constants: { Colors } } = require('powercord/webpack');
const { waitFor } = require('powercord/util');
const { ItemGroup } = require('./index.js');

const Clickable = AsyncComponent.from(getModuleByDisplayName('Clickable'));
const Icon = AsyncComponent.from(getModuleByDisplayName('Icon'));
const VerticalScroller = AsyncComponent.from(getModuleByDisplayName('VerticalScroller'));

const { AppReferencePositionLayer } = Object.values(require('powercord/webpack').instance.cache)
  .filter(m => m.exports && m.exports.AppReferencePositionLayer).map(m => m.exports)[0];

let isFragment = null;
let classes = null;

setImmediate(async () => {
  isFragment = { isFragment } = (await getModule([ 'isFragment' ])).isFragment;
  classes = {
    ...await getModule([ 'scrollbar', 'scrollerWrap' ]),
    ...await getModule([ 'itemToggle', 'checkbox' ])
  };
});

module.exports = class NewSubMenuItem extends React.PureComponent {
  constructor (props) {
    super();

    this.state = {
      isPowercord: props.label === 'Powercord'
    };

    this.ref = React.createRef();
    this.handleClick = () => {
      if (props.action) {
        props.action();

        contextMenu.closeContextMenu();
      }
    };

    this.handleMouseEnter = () => {
      clearTimeout(this._timer);

      this.setState({
        open: true
      });
    };

    this.handleMouseLeave = () => {
      clearTimeout(this._timer);

      this._timer = setTimeout(() => this.setState({
        open: false
      }), 100);
    };

    this.setRef = (e) => this.ref.current = e;
  }

  async componentDidUpdate () {
    await waitFor(`.${classes.contextMenu.split(' ')[0]}`);

    const contextMenus = document.querySelectorAll(`.${classes.contextMenu.split(' ')[0]}`);
    if (contextMenus.length > 0) {
      const contextMenu = contextMenus[contextMenus.length - 1].__reactInternalInstance$;
      const updater = contextMenu.return.memoizedProps.onHeightUpdate;
      if (typeof updater === 'function') {
        updater();
      }
    }
  }

  componentWillUnmount () {
    clearTimeout(this._timer);
  }

  render () {
    const _this = this;
    const { isPowercord } = this.state;

    const children = typeof this.props.render === 'function' ? this.props.render() : this.props.render.filter(child => child);
    const length = (0, isFragment)(children) ? children.props.children.length : children.length;
    const itemSubMenu = length === 0
      ? null
      : React.createElement('div', {
        className: 'quickActions-contextMenu-submenu',
        title: this.props.desc || null
      }, React.createElement(Clickable, {
        innerRef: this.setRef,
        className: [ classes.itemSubMenu, this.state.open ? classes.selected : null ].filter(Boolean).join(' '),
        onClick: this.props.disabled ? () => null : this.handleClick,
        onMouseEnter: this.props.disabled ? null : this.handleMouseEnter,
        onMouseLeave: this.props.disabled ? null : this.handleMouseLeave
      }, React.createElement('div', {
        className: classes.label
      }, this.props.label), React.createElement('div', {
        className: classes.hint
      }, this.props.hint), React.createElement(Icon, {
        name: 'Nova_Caret',
        className: classes.caret
      }), this.state.open
        ? React.createElement(AppReferencePositionLayer, {
          position: 'right',
          align: 'bottom',
          autoInvert: true,
          nudgeAlignIntoViewport: true,
          spacing: 12,
          reference: this.ref
        // eslint-disable-next-line prefer-arrow-callback
        }, function () {
          return React.createElement('div', {
            className: [ isPowercord ? 'quickActions-contextMenu' : null, classes.subContextMenu ].filter(Boolean).join(' '),
            onClick: (e) => e.stopPropagation()
          }, (isPowercord ? length > 21 : typeof _this.props.scroller !== 'undefined' ? _this.props.scroller !== false : length > 8)
            ? React.createElement(VerticalScroller, {
              className: [ classes.contextMenu, classes.scroller ].filter(Boolean).join(' '),
              theme: classes.themeGhostHairline,
              backgroundColor: _this.props.theme === 'light' ? Colors.WHITE : Colors.PRIMARY_DARK_800,
              style: { maxHeight: isPowercord ? '728px' : null }
            }, children)
            : React.createElement('div', {
              className: classes.contextMenu
            }, children));
        })
        : null));

    if (this.props.seperated) {
      return React.createElement(ItemGroup, {
        children: [ itemSubMenu ]
      });
    }

    return itemSubMenu;
  }

  getLayerPosition () {
    const contextMenu = document.querySelectorAll(`.${classes.contextMenu.split(' ')[0]}`);
    const targetOffset = contextMenu[contextMenu.length - 1].getBoundingClientRect();
    if (targetOffset.right + 188 > window.innerWidth) {
      return 'left';
    }

    return 'right';
  }

  getLayerAlignment () {
    const contextMenu = document.querySelectorAll(`.${classes.contextMenu.split(' ')[0]}`);
    const subMenuContext = document.querySelectorAll(`.${classes.subMenuContext.split(' ')[0]}`);

    let targetOffset1, targetOffset2;

    if (contextMenu.length > 0) {
      const firstContextMenu = contextMenu[contextMenu.length - 1];
      if (firstContextMenu.parentElement.className.includes('layer')) {
        targetOffset1 = firstContextMenu.parentElement.getBoundingClientRect();
      }
    }

    if (subMenuContext.length > 0) {
      targetOffset2 = subMenuContext[subMenuContext.length - 1].getBoundingClientRect();
    }

    if (targetOffset1) {
      if (targetOffset1.bottom + 298 > window.innerHeight) {
        return 'bottom';
      }
    } else if (targetOffset2) {
      if (targetOffset2.bottom + 298 > window.innerHeight) {
        return 'bottom';
      }
    }

    return 'top';
  }
};
