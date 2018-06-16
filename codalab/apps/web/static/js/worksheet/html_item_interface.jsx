
// Display a worksheet item which is the HTML file in a bundle.
var HTMLItem = React.createClass({
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
        var className = 'type-html' + (this.props.focused ? ' focused' : '');
        var contents = html_sanitize(this.props.item.interpreted.join(''));
        var bundleInfo = this.props.item.bundles_spec.bundle_infos[0];
        return(
            <div className="ws-item" onClick={this.handleClick} onContextMenu={this.props.handleContextMenu.bind(null, bundle_info.uuid, this.props.focusIndex, 0, bundleInfo.bundle_type === 'run')}>
                <div className={className} ref={this.props.item.ref}>
                    <div className="html-bundle" dangerouslySetInnerHTML={{__html: contents}}>
                    </div>
                </div>
            </div>
        );
    }
});
