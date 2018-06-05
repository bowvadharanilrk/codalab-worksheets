/*
Information about the current worksheet and its items.
*/

var WorksheetContent = function() {
    function WorksheetContent(uuid) {
        this.uuid = uuid;
        this.info = null;  // Worksheet info
    }

    WorksheetContent.prototype.fetch = function(props) {
        // Set defaults
        props = props || {};
        props.success = props.success || function(data){};
        props.error = props.error || function(xhr, status, err){};
        if (props.async === undefined) {
            props.async = true;
        }

        $.ajax({
            type: 'GET',
            url: '/rest/interpret/worksheet/' + this.uuid,
            // TODO: migrate to using main API
            // url: '/rest/worksheets/' + ws.uuid,
            async: props.async,
            dataType: 'json',
            cache: false,
            success: function(info) {
                this.info = info;
                props.success(this.info);
            }.bind(this),
            error: function(xhr, status, err) {
                props.error(xhr, status, err);
            }.bind(this)
        });
    };

    WorksheetContent.prototype.saveWorksheet = function(props) {
        if (this.info === undefined) return;
        $('#update_progress').show();
        props = props || {};
        props.success = props.success || function(data){};
        props.error = props.error || function(xhr, status, err){};
        $('#save_error').hide();
        $.ajax({
            type: 'POST',
            cache: false,
            url: '/rest/worksheets/' + this.uuid + '/raw',
            dataType: 'json',
            data: this.info.raw.join('\n'),
            success: function(data) {
                console.log('Saved worksheet ' + this.info.uuid);
                props.success(data);
            }.bind(this),
            error: function(xhr, status, err) {
                props.error(xhr, status, err);
            }.bind(this)
        });
    };

    return WorksheetContent;
}();
