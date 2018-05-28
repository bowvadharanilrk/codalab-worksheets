
// Display a worksheet item representing the file contents of a bundle.
var ContentsItem = React.createClass({
    mixins: [CheckboxMixin, GoToBundleMixin],
    getInitialState: function(){
        return {};
    },

    handleClick: function(event){
        this.props.setFocus(this.props.focusIndex, 0);
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      return worksheetItemPropsChanged(this.props, nextProps);
    },

    render: function() {
        var className = 'type-contents' + (this.props.focused ? ' focused' : '');
        if (!this.props.item.lines) {
            return (
              <div></div>
            );
        }
        var contents = this.props.item.lines.join('');
        var bundleInfo = this.props.item.bundles_spec.bundle_infos[0];
        return(
            <div className="ws-item" onClick={this.handleClick} onContextMenu={this.props.handleContextMenu.bind(null, bundleInfo.uuid, this.props.focusIndex, 0, bundleInfo.bundle_type === 'run')}>
                <div className={className} ref={this.props.item.ref}>
                    <blockquote>
                        <p>{contents}</p>
                    </blockquote>
                </div>
            </div>
        );
    }
});
