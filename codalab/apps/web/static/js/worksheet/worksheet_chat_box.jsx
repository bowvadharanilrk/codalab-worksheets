window.DEFAULT_ID = '-1';

var WorksheetChatBox = React.createClass({

  isFocusBundle: function(focusIndex, subFocusIndex) {
    return focusIndex === 0 && subFocusIndex != -1;
  },

  getInitialState: function() {
    return {
      worksheetId: window.DEFAULT_ID,
      bundleId: window.DEFAULT_ID,
      numOfChatHistory: 0,
    }
  },

  componentWillReceiveProps: function(nextProps) {
    var bundleId = window.DEFAULT_ID;
    if (this.isFocusBundle(nextProps.focusIndex, nextProps.subFocusIndex)) {
      bundleId = nextProps.ws.info.items[nextProps.focusIndex].bundles_spec.bundle_infos[nextProps.subFocusIndex].uuid;
    }
    this.setState({
      worksheetId: nextProps.ws.uuid,
      bundleId: bundleId,
    });
  },

  componentDidMount: function () {
    var self = this;
    $("#chat_box").chatbox({
      chatBoxId: 'chat_box',
      title : "Questions or feedback?",
      user : "You",
      offset: 50,
      messageSent: function(id, user, msg) {
        // this refers to the chat box, self refers to the React component
        self.handleMessageSent(this, id, user, msg);
      },
    });
    this.loadChatHistory();
    setInterval(function(){
      this.loadChatHistory();
    }.bind(this), 10 * 1000);
  },

  loadChatHistory: function(props) {
    // this check is only for first fetch, right after worksheet_interface passes userId to worksheet_chat_box
    var userInfo = this.props.userInfo;
    if (userInfo === null) return;
    $.ajax({
      url: '/rest/chats',
      dataType: 'json',
      cache: false,
      type: 'GET',
      data: {
        user_id: userInfo.user_id,
      },
      success: function(data) {
        var chats = data.chats;
        var newMsgIndex = this.state.numOfChatHistory;
        for (var i = newMsgIndex; i < chats.length; i++) {
          var chat = chats[i];
          var sender = '';
          if (chat.sender_user_id === userInfo.user_id) {
            sender = 'You';
          } else if (chat.sender_user_id === chats.system_user_id) {
            sender = 'System';
          } else if (chat.sender_user_id === chats.root_user_id) {
            sender = 'Admin';
          } else {
            sender = chat.sender_user_id;
          }
          $("#chat_box").chatbox("option", "boxManager").addMsg(sender, chat.message);
        }
        this.setState({
          numOfChatHistory: chats.length,
          systemUserId: chats.system_user_id,
          rootUserId: chats.root_user_id,
        });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(xhr.responseText);
      }.bind(this)
    });
  },

  handleMessageSent: function(chatbox, id, user, msg){
    chatbox.boxManager.addMsg(user, msg);
    this.setState({numOfChatHistory: this.state.numOfChatHistory + 1});
    $.ajax({
      url: '/rest/chats',
      data: {
        senderUserId: this.props.userId,
        recipientUserId: this.state.systemUserId,
        message: msg,
        worksheetId: this.state.worksheetId,
        bundleId: this.state.bundleId,
      },
      type: 'POST',
      success: function (data, status, jqXHR) {
        // auto response
        chatbox.boxManager.addMsg('System', data.chats);
        this.setState({numOfChatHistory: this.state.numOfChatHistory + 1});
      }.bind(this),
      error: function (xhr, status, error) {
        console.error(xhr.responseText);
      }.bind(this)
    })
  },

  render: function () {
    return (
      <div id="chat_box">
      </div>
    );
  }
});
