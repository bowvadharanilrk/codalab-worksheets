/*
Displays the list of items on the worksheet page.
A worksheet item is an interpreted items (either a contiguous block of markup
or a table, record, image, contents).  Note: different from worksheet item in
the bundle service.
*/

var WorksheetItemList = React.createClass({
    componentDidUpdate: function() {
        var info = this.props.ws.info;
        if (!info || !info.items.length) {
            $('.empty-worksheet').fadeIn('fast');
        }
    },

    capture_keys: function() {
        if (!this.props.active)  // If we're not the active component, don't bind keys
            return;

        // Open a new window (really should be handled at the item level)
        Mousetrap.bind(['enter'], function() {
            if (this.props.focusIndex < 0) return;
            var url = this.refs['item' + this.props.focusIndex].props.url;
            if (url)
              window.open(url, '_blank');
        }.bind(this), 'keydown');

        // Move focus to the top
        Mousetrap.bind(['g g'], function() {
            $('body').stop(true).animate({scrollTop: 0}, 'fast');
            this.props.setFocus(-1, 0);
        }.bind(this), 'keydown');

        // Move focus to the bottom
        Mousetrap.bind(['shift+g'], function() {
            this.props.setFocus(this.props.ws.info.items.length - 1, 'end');
            $('html, body').animate({scrollTop: $(document).height()}, 'fast');
        }.bind(this), 'keydown');
    },

    bundleUuidToIndex: function() {
      // bundle uuid -> an array of [index, subIndex], corresponding to positions where the bundle occurs
      // E.g. 0x47bda9 -> [[0, 1], [2, 3]], which means bundle 0x47bda9 appears twice in the current worksheet
      var uuidToIndex = {};
      var info = this.props.ws.info;
      if (info && info.items.length > 0) {
        var items = info.items;
        for (var index = 0; index < items.length; index++) {
          if (items[index].bundles_spec) {
            for (var subIndex = 0; subIndex < items[index].bundles_spec.bundle_infos.length; subIndex++) {
              var bundle_info = items[index].bundles_spec.bundle_infos[subIndex];
              if (!(bundle_info.uuid in uuidToIndex))
                uuidToIndex[bundle_info.uuid] = [];
              uuidToIndex[bundle_info.uuid].push([index, subIndex]);
            }
          }
        }
      }
      return uuidToIndex;
    },

    handleContextMenuSelection: function(uuid, focusIndex, subFocusIndex, option) {
      var type = option[0]
      var args = option[1];
      args.push(uuid);
      if (type === ContextMenuEnum.command.ADD_BUNDLE_TO_HOMEWORKSHEET) {
        args.push('/');
      } else if (type === ContextMenuEnum.command.DETACH_BUNDLE) {
        var uuidToIndex = this.bundleUuidToIndex();
        if (uuidToIndex[uuid].length > 1) {
          // if a bundle appears more than once in the current worksheet, take the last one
          for (var i = uuidToIndex[uuid].length - 1; i >= 0; i--) {
            var indices = uuidToIndex[uuid][i];
            if (indices[0] === focusIndex && indices[1] === subFocusIndex)
              break;
          }
          // index counting from the end
          args.push('-n', uuidToIndex[uuid].length - i)
        }
      }
      $('#command_line').terminal().exec(buildTerminalCommand(args));
    },

    handleContextMenu: function(uuid, focusIndex, subFocusIndex, isRunBundle, e) {
      e.preventDefault();
      this.props.setFocus(focusIndex, subFocusIndex, false);
      var bundleType = isRunBundle ? ContextMenuEnum.type.RUN : ContextMenuEnum.type.BUNDLE;
      ContextMenuMixin.openContextMenu(bundleType, this.handleContextMenuSelection.bind(undefined, uuid, focusIndex, subFocusIndex));
    },

    render: function() {
        this.capture_keys(); // each item capture keys are handled dynamically after this call

        // Create items
        var items_display;
        var info = this.props.ws.info;
        if (info && info.items.length > 0) {
            var worksheet_items = [];
            info.items.forEach(function(item, index) {
                var focused = (index === this.props.focusIndex);
                var props = {
                  item: item,
                  version: this.props.version,
                  active: this.props.active,
                  focused: focused,
                  canEdit: this.props.canEdit,
                  focusIndex: index,
                  subFocusIndex: focused ? this.props.subFocusIndex : null,
                  setFocus: this.props.setFocus,
                  focusActionBar: this.props.focusActionBar,
                  openWorksheet: this.props.openWorksheet,
                  handleContextMenu: this.handleContextMenu
                };
                addWorksheetItems(props, worksheet_items);
            }.bind(this));
            items_display = worksheet_items;
        } else {
          items_display = <p className="empty-worksheet">(empty)</p>;
        }
        if (info && info.error)
          items_display = <p className="alert-danger">Error in worksheet: {info.error}</p>;
        return <div id="worksheet_items">{items_display}</div>;
    }
});

////////////////////////////////////////////////////////////

// Create a worksheet item based on props and add it to worksheet_items.
// - item: information about the table to display
// - index: integer representing the index in the list of items
// - focused: whether this item has the focus
// - canEdit: whether we're allowed to edit this item
// - setFocus: call back to select this item
// - updateWorksheetSubFocusIndex: call back to notify parent of which row is selected (for tables)
var addWorksheetItems = function(props, worksheet_items) {
    var item = props.item;

    // Determine URL corresponding to item.
    var url = null;
    if (item.bundles_spec && item.bundles_spec.bundle_infos[0] && item.bundles_spec.bundle_infos[0].uuid)
      url = '/bundles/' + item.bundles_spec.bundle_infos[0].uuid;
    if (item.subworksheet_info)
      url = '/worksheets/' + item.subworksheet_info.uuid;

    props.key = props.ref = 'item' + props.focusIndex;
    props.url = url;

    var constructor = {
      'markup_block': MarkdownItem,
      'table_block': TableItem,
      'contents_block': ContentsItem,
      'subworksheets_block': WorksheetItem,
      'record_block': RecordItem,
      'image_block': ImageItem,
      'graph_block': GraphItem,
    }[item.mode];

    var elem;
    if (constructor) {
      elem = React.createElement(constructor, props);
    } else {
      elem = (
          <div>
              <strong>
                  Internal error: {item.mode}
              </strong>
          </div>
      );
    }
    worksheet_items.push(elem);
};
