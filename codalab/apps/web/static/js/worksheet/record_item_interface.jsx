
// Display a worksheet item which corresponds to a record.
var RecordItem = React.createClass({
    mixins: [CheckboxMixin, GoToBundleMixin],
    getInitialState: function() {
        return {};
    },

    handleClick: function(event) {
        this.props.setFocus(this.props.focusIndex, 0);
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      return worksheetItemPropsChanged(this.props, nextProps);
    },

    render: function() {
        var item = this.props.item;
        var className = 'table table-record' + (this.props.focused ? ' focused' : '');
        var bundleInfo = this.props.item.bundles_spec.bundle_infos[0];
        var header = item.header;
        var k = header[0];
        var v = header[1];
        var items = item.rows.map(function(item, index) {
            var ref = 'row' + index;
            return(
                <tr ref={ref} key={index}>
                    <th>
                        {item[k]}
                    </th>
                    <td>
                        {item[v]}
                    </td>
                </tr>
            )
        });
        return (
            <div className="ws-item" onClick={this.handleClick} onContextMenu={this.props.handleContextMenu.bind(null, bundleInfo.uuid, this.props.focusIndex, 0, bundleInfo.bundle_type === 'run')}>
                <div className="type-record">
                    <table className={className}>
                        <tbody>
                            {items}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
});
