/*
Shows the side panel which contains information about the current bundle or
worksheet (with the focus).
*/

var WorksheetSidePanel = React.createClass({
    getInitialState: function() {
        return {};
    },
    componentDidMount: function(e) {
        var self = this;
        $('#dragbar_vertical').mousedown(function(e) {
            self.resizePanel(e);
        });
        $(document).mouseup(function(e) {
            $(this).unbind('mousemove');
        });
        $(window).resize(function(e) {
            self.resetPanel();
        });
        var refreshWorksheetSidePanel = function() {
            if (this.refs.hasOwnProperty('worksheet_info_side_panel')) {
                this.refs.worksheet_info_side_panel.refreshWorksheet();
            }
        };
        this.debouncedRefreshBundleSidePanel = _.debounce(this.refreshBundleSidePanel, 200).bind(this);
        this.debouncedRefreshWorksheetSidePanel = _.debounce(refreshWorksheetSidePanel, 200).bind(this);
    },

    refreshBundleSidePanel: function() {
      if (this.refs.hasOwnProperty('bundle_info_side_panel')) {
        this.refs.bundle_info_side_panel.refreshBundle();
      }
    },

    componentDidUpdate: function() {
      this.debouncedRefreshBundleSidePanel();
      this.debouncedRefreshWorksheetSidePanel();
    },

    getFocus: function() {
        // Return the state to show on the side panel
        var info = this.props.ws.info;
        if (!info) return null;
        if (this.props.focusIndex == -1)  // Not focus on anything, show worksheet
          return info;
        return info.items[this.props.focusIndex];
    },

    // What kind of thing is it?
    isFocusWorksheet: function(focus) {
      return focus.mode === undefined || focus.mode == 'worksheet' || focus.mode == 'wsearch';
    },
    isFocusMarkup: function(focus) {
      // If search and didn't return bundles, then count as markup
      return focus.mode == 'markup' || (focus.mode == 'search' && (!focus.interpreted.items[0] || focus.interpreted.items[0].bundle_info === undefined));
    },
    isFocusBundle: function(focus) {
      return !this.isFocusWorksheet(focus) && !this.isFocusMarkup(focus);
    },
    getBundleInfo: function(focus) {
      if (focus.mode == 'table')  // Drill down into row of table
          return this.props.subFocusIndex != -1 ? focus.bundle_info[this.props.subFocusIndex] : null;
      else if (focus.mode == 'search')
          return this.props.subFocusIndex != -1 ? focus.interpreted.items[0].bundle_info[this.props.subFocusIndex] : null;
      else
          return focus.bundle_info;
    },
    getWorksheetInfo: function(focus) {
      if (focus.mode == 'worksheet')
        return focus.subworksheet_info;
      else if (focus.mode == 'wsearch') {
        if (this.props.subFocusIndex == -1)
          return null;
        var item = focus.interpreted.items[this.props.subFocusIndex];
        return item ? item.subworksheet_info : null;
      }
      else
        return focus;
    },

    resizePanel: function(e) {
        e.preventDefault();
        $(document).mousemove(function(e) {
            var windowWidth = $(window).width();
            var panelWidth = windowWidth - e.pageX;
            var panelWidthPercentage = (windowWidth - e.pageX) / windowWidth * 100;
            if (240 < panelWidth && panelWidthPercentage < 55) {
                $('.ws-container').css('width', e.pageX);
                $('.ws-panel').css('width', panelWidthPercentage + '%');
                $('#dragbar_vertical').css('right', panelWidthPercentage + '%');
            }
        });
    },
    resetPanel: function() {
        var windowWidth = $(window).width();
        if (windowWidth < 768) {
            $('.ws-container').removeAttr('style');
        } else {
            var panelWidth = parseInt($('.ws-panel').css('width'));
            var containerWidth = windowWidth - panelWidth;
            $('.ws-container').css('width', containerWidth);
        }
    },

    render: function() {
        //console.log('WorksheetSidePanel.render');

        var bundle_uploader = <BundleUploader
          ws={this.props.ws}
          refreshWorksheet={this.props.bundleMetadataChanged}
        />;

        var run_bundle_builder = <RunBundleBuilder
          ws={this.props.ws}
          escCount={this.props.escCount}
        />;

        var new_worksheet = <NewWorksheet
          escCount={this.props.escCount}
          userInfo={this.props.userInfo}
        />;

        var focus = this.getFocus();
        var side_panel_details = '';
        if (focus) {
          if (this.isFocusWorksheet(focus)) {
            // Show worksheet (either main worksheet or subworksheet)
            var worksheet_info = this.getWorksheetInfo(focus);

            side_panel_details = <WorksheetDetailSidePanel
                                   key={'ws' + this.props.focusIndex}
                                   worksheet_info={worksheet_info}
                                   bundleMetadataChanged={this.props.bundleMetadataChanged}
                                   ref="worksheet_info_side_panel"
                                 />;
          } else if (this.isFocusMarkup(focus)) {
            // Show nothing (maybe later show markdown just for fun?)
          } else if (this.isFocusBundle(focus)) {
            // Show bundle (either full bundle or row in table)
            var bundle_info = this.getBundleInfo(focus);
            if (bundle_info) {
              side_panel_details = <Bundle
                                     uuid={bundle_info.uuid}
                                     bundleMetadataChanged={this.props.bundleMetadataChanged}
                                     ref="bundle_info_side_panel"
                                   />;
            }
          } else {
            console.error('Unknown mode: ' + focus.mode);
          }
        }

        return (
          <div className="ws-panel">
            <div className='ws-button-group'>
              {bundle_uploader}
              {run_bundle_builder}
              {new_worksheet}
            </div>
              {side_panel_details}
          </div>
        );
    }
});

////////////////////////////////////////////////////////////

// When selecting a worksheet.
// TODO: use /rest/worksheets/ end point
var WorksheetDetailSidePanel = React.createClass({
    getInitialState: function() {
        return { };
    },

    refreshWorksheet: function() {
        var ws = this.props.worksheet_info;
        var onSuccess = function(data, status, jqXHR) {
            this.setState(data);
        }.bind(this);
        var onError = function(jqXHR, status, error) {
            console.error(jqXHR.responseText);
        }.bind(this);
        $.ajax({
            type: 'GET',
            url: '/rest/interpret/worksheet/' + ws.uuid,
            success: onSuccess,
            error: onError,
        });
    },

    render: function() {
      // Select the current worksheet or the subworksheet.
      var worksheet = this.state;
      var isEmptyObject = function(obj) {
          // based on: http://stackoverflow.com/questions/4994201/is-object-empty
          for (var key in obj) {
              if (hasOwnProperty.call(obj, key)) return false;
          }
          return true;
      };
      if (isEmptyObject(worksheet)) worksheet = this.props.worksheet_info;

      if (!worksheet) return <div />;

      // Show brief summary of contents.
      var rows = [];
      if (worksheet.items) {
        worksheet.items.forEach(function(item) {
          if (item.bundle_info) {
            // Show bundle
            var bundle_infos = item.bundle_info;
            if (!(bundle_infos instanceof Array))
              bundle_infos = [bundle_infos];

            bundle_infos.forEach(function(b) {
              var url = "/bundles/" + b.uuid;
              var short_uuid = shorten_uuid(b.uuid);
              rows.push(<tr>
                <td>{b.bundle_type}</td>
                <td><a href={url} target="_blank">{b.metadata.name}({short_uuid})</a></td>
              </tr>);
            });
          } else if (item.mode == 'worksheet') {
            // Show worksheet
            var info = item.subworksheet_info;
            var title = info.title || info.name;
            var url = '/worksheets/' + info.uuid;
            rows.push(<tr>
              <td>worksheet</td>
              <td><a href={url} target="_blank">{title}</a></td>
            </tr>);
          }
        });
      }

      var bundles_html = (
        <div className="bundles-table">
            <table className="bundle-meta table">
                <thead>
                  <tr>
                    <th>type</th>
                    <th>name</th>
                  </tr>
                </thead>
                <tbody>
                  {rows}
                </tbody>
            </table>
        </div>
      );

      return (
          <div id="panel_content">
              <table className="bundle-meta table">
                <tr><th>uuid</th><td>{worksheet.uuid}</td></tr>
                <tr><th>name</th><td><WorksheetEditableField canEdit={true} fieldName="name" value={worksheet.name} uuid={worksheet.uuid} onChange={this.props.bundleMetadataChanged} /></td></tr>
                <tr><th>title</th><td><WorksheetEditableField canEdit={true} fieldName="title" value={worksheet.title} uuid={worksheet.uuid} onChange={this.props.bundleMetadataChanged} /></td></tr>
                <tr><th>owner</th><td>{worksheet.owner_name}</td></tr>
                <tr><th>permissions</th><td>{render_permissions(worksheet)}</td></tr>
              </table>
              {bundles_html}
          </div>
      );
    }
});
