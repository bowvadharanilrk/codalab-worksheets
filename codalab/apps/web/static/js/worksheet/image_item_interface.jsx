
// Display a worksheet item which is an image file in a bundle.
var ImageItem = React.createClass({
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
        var className = 'type-image' + (this.props.focused ? ' focused' : '');
        var src = "data:image/png;base64," + this.props.item.image_data;
        var styles = {};
        if (this.props.item.hasOwnProperty('height')) {
            styles['height'] = this.props.item.height + "px;"
        }
        if (this.props.item.hasOwnProperty('width')) {
            styles['width'] = this.props.item.width + "px;"
        }

        return(
            <div className="ws-item" onClick={this.handleClick}>
                <div className={className} ref={this.props.item.ref}>
                    <img style={styles} src={src} />
                </div>
            </div>
        );
    }
});
