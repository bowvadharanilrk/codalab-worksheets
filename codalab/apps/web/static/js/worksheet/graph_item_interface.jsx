
// Display a graph over the different bundles.
var GraphItem = React.createClass({
    mixins: [CheckboxMixin, GoToBundleMixin],
    getInitialState: function() {
      return {};
    },

    handleClick: function() {
      this.props.setFocus(this.props.focusIndex, 0);
    },

    _xi: function() {
      var props = this.props.item.properties;
      return props.x ? parseInt(props.x) : 0;
    },
    _yi: function() {
      var props = this.props.item.properties;
      return props.y ? parseInt(props.y) : 1;
    },

    // Return data for C3
    _getData: function() {
      var item = this.props.item;

      // Index in the table to find x and y
      var xi = this._xi();
      var yi = this._yi();

      // Create a bunch of C3 'columns', each of which is a label followed by a sequence of numbers.
      // For example: ['accuracy', 3, 5, 7].
      // Each trajectory is a bundle that we wish to plot and contributes two
      // columns, one for x and y.
      var ytox = {};  // Maps the names of the y columns to x columns
      var columns = [];
      var totalNumPoints = 0;
      for (var i = 0; i < item.interpreted.length; i++) {  // For each trajectory
        var info = item.interpreted[i];
        var points = info.points;
        if (!points) continue;  // No points...
        var display_name = i + ': ' + info.display_name;
        var xcol = [display_name + '_x'];
        var ycol = [display_name];

        ytox[ycol[0]] = xcol[0];
        for (var j = 0; j < points.length; j++) {  // For each point in that trajectory
          var pt = points[j];
          var x = pt[xi];
          var y = pt[yi];
          xcol.push(x);
          ycol.push(y);
        }
        columns.push(xcol);
        columns.push(ycol);
        totalNumPoints += points.length;
      }
      // console.log('GraphItem._getData: %s points', totalNumPoints);
      return {
        xs: ytox,
        columns: columns,
      };
    },

    _chartId: function() {
      return 'chart-' + this.props.focusIndex;
    },

    componentDidMount: function() {
      //console.log('GraphItem: componentDidMount');

      // Axis labels
      var item = this.props.item;
      var xlabel = item.properties.xlabel || this._xi();
      var ylabel = item.properties.ylabel || this._yi();

      var chart = c3.generate({
        bindto: '#' + this._chartId(),
        data: {json: {}},
        axis: {
          x: {label: {text: xlabel, position: 'outer-middle'}},
          y: {label: {text: ylabel, position: 'outer-middle'}},
        },
      });
      this.setState({'chart': chart});
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      return worksheetItemPropsChanged(this.props, nextProps);
    },

    render: function() {
        //console.log('GraphItem.render', this.state.chart);

        // Rendering the chart is slow, so throttle it.
        var self = this;
        function renderChart() {
          if (self.state.chart) {
            // TODO: unload only trajectories which are outdated.
            self.state.chart.load(self._getData());
          }
        }
        if (this.throttledRenderChart === undefined)
            this.throttledRenderChart = _.throttle(renderChart, 2000).bind(this);
        this.throttledRenderChart();

        var className = 'type-image' + (this.props.focused ? ' focused' : '');
        var bundleInfo = this.props.item.bundles_spec.bundle_infos[0];
        return (
            <div className="ws-item" onClick={this.handleClick} onContextMenu={this.props.handleContextMenu.bind(null, bundleInfo.uuid, this.props.focusIndex, 0, bundleInfo.bundle_type === 'run')}>
                <div className={className}>
                    <div id={this._chartId()} />
                </div>
            </div>
        );
    }
});
