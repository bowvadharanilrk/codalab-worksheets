var RunBundleBuilder = React.createClass({
  propTypes: {
    // should be one of 'DEFAULT', 'SIGN_IN_REDIRECT', or 'DISABLED'.
    // 'DEFAULT': the user can access the run bundle builder modal.
    // 'SIGN_IN_REDIRECT': the user is redirected to the sign in page.
    // 'DISABLED': the button is grayed out and cannot be clicked.
    clickAction: React.PropTypes
      .oneOf(['DEFAULT', 'SIGN_IN_REDIRECT', 'DISABLED'])
      .isRequired,

    // a worksheet object; bundles are run on this worksheet.
    ws: React.PropTypes.object.isRequired,

    // a callback function that's used as a hack to
    // support escape key functionality
    escCount: React.PropTypes.number.isRequired,
  },

  getInitialState: function() {
    return {
      showBuilder: false,
      selectedDependencies: [],
      dependencyKeyList: [],
      command: null,
      clCommand: '',
    };
  },

  toggleBuilder: function() {
    if (this.state.showBuilder) {
      $('#run-bundle-builder').css('display', 'none');
      $(".run-bundle-check-box").attr("checked", false);
      this.setState({
        selectedDependencies: [],
        dependencyKeyList: [],
        command: null,
        clCommand: '',
      });
    } else {
      $('#run-bundle-builder').css('display', 'block');
      $('#run-bundle-terminal-command').focus();
    }
    this.setState({showBuilder: !this.state.showBuilder});
  },

  createRunBundle: function() {
    var clCommand = this.getClCommand(this.state.selectedDependencies, this.state.dependencyKeyList, this.state.command);
    var response = $('#command_line').terminal().exec(clCommand);
    this.toggleBuilder();
  },

  handleDependencySelection: function(bundle_uuid, bundle_name, path, e) {
    var newDep = {
      "uuid": bundle_uuid,
      'bundle_name': bundle_name,
      'path': path
    };
    var selectedDependencies = this.state.selectedDependencies.slice();
    var dependencyKeyList = this.state.dependencyKeyList.slice();
    if (e.target.checked) {
      // add a dependency
      selectedDependencies.push(newDep);
      var key = newDep.path === '' ? newDep.bundle_name : newDep.path.substring(newDep.path.lastIndexOf('/') + 1);
      dependencyKeyList.push(key);
    } else {
      // remove a dependency
      var removedDepIndex = null;
      selectedDependencies = selectedDependencies.filter(function(ele, i) {
        depEqual = ele.uuid === newDep.uuid && ele.bundle_name === newDep.bundle_name && ele.path === newDep.path;
        if (depEqual)
          removedDepIndex = i;
        return !depEqual;
      });
      dependencyKeyList.splice(removedDepIndex, 1);
    }
    var clCommand = this.getClCommand(selectedDependencies, dependencyKeyList, this.state.command);
    this.setState({
      selectedDependencies: selectedDependencies,
      dependencyKeyList: dependencyKeyList,
      clCommand: clCommand
    });
  },

  handleKeyChange: function(index, event) {
    var dependencyKey = event.target.value;
    var dependencyKeyList = this.state.dependencyKeyList.slice();
    dependencyKeyList[index] = dependencyKey;
    var clCommand = this.getClCommand(this.state.selectedDependencies, dependencyKeyList, this.state.command);
    this.setState({
      dependencyKeyList: dependencyKeyList,
      clCommand: clCommand,
    });
  },

  handleCommandChange: function(event) {
    var command = event.target.value;
    var clCommand = this.getClCommand(this.state.selectedDependencies, this.state.dependencyKeyList, command, false);
    this.setState({
      command: command,
      clCommand: clCommand,
    });
  },

  getClCommand: function(selectedDependencies, dependencyKeyList, command) {
    var clCommand = ['run'];
    for (var i = 0; i < dependencyKeyList.length; i++) {
      var key = dependencyKeyList[i];
      var target = selectedDependencies[i];
      var shortUuid = shorten_uuid(target.uuid);
      target = target.path === '' ? shortUuid : shortUuid + '/' + target.path;
      clCommand.push(key + ':' + target);
    }
    if (command != null)
      clCommand.push(command);
    return buildTerminalCommand(clCommand);
  },

  componentWillReceiveProps: function(newProps) {
    if (newProps.escCount != this.props.escCount && this.state.showBuilder) {
      this.toggleBuilder();
    }
  },

  componentDidUpdate: function() {
    var clCommandHTML = $('#run-bundle-cl-command-container')
    clCommandHTML.scrollLeft(clCommandHTML[0].scrollWidth);
  },

  render: function () {
    var bundles_html = (
      <BundleBrowser
        ws={this.props.ws}
        handleDependencySelection={this.handleDependencySelection}
        showBuilder={this.state.showBuilder}
      />
    );

    var run_bundle_terminal = (
      <RunBundleTerminal
        selectedDependencies={this.state.selectedDependencies}
        dependencyKeyList={this.state.dependencyKeyList}
        command={this.state.command}
        handleKeyChange={this.handleKeyChange}
        handleCommandChange={this.handleCommandChange}
        createRunBundle={this.createRunBundle}
        toggleBuilder={this.toggleBuilder}
      />
    );

    var run_button = (
      <Button
        text='Run'
        type='primary'
        handleClick={this.createRunBundle}
      />
    );

    var cancel_button = (
      <Button
        text='Cancel'
        type='default'
        handleClick={this.toggleBuilder}
      />
    );

    /*** creating runBundleButton ***/
    var typeProp, handleClickProp;
    switch (this.props.clickAction) {
      case 'DEFAULT':
        handleClickProp = this.toggleBuilder;
        typeProp = 'primary';
        break;
      case 'SIGN_IN_REDIRECT':
        handleClickProp = createHandleRedirectFn(this.props.ws.info ? this.props.ws.info.uuid : null);
        typeProp = 'primary';
        break;
      case 'DISABLED':
        handleClickProp = null;
        typeProp = 'disabled';
        break;
      default:
        break;
    }

    var runBundleButton = (
      <Button
        text='New Run'
        type={typeProp}
        handleClick={handleClickProp}
        flexibleSize={true}
      />
    );

    return (
      <div className='inline-block'>
        <div id='run-bundle-builder'>
          <span className='close' onClick={this.toggleBuilder}>×</span>
          <div className='pop-up-title'>Create Run Bundle</div>
          <div className='run-bundle-container'>
            <div className='run-bundle-text pop-up-text'>Step 1: Select any dependencies (either bundles or the files/directories inside).</div>
            <div id='bundle-browser'>
              {bundles_html}
            </div>
          </div>
          <div className='run-bundle-container'>
            <div className='run-bundle-text pop-up-text'>Step 2: Enter a shell command, which will be run in a directory with the dependencies (rename if desired).</div>
            <div id='run-bundle-terminal'>
              {run_bundle_terminal}
            </div>
          </div>
          <div id='run-bundle-cl-command-container'>CodaLab>&nbsp;
            <span id='run-bundle-cl-command' className='pop-up-command'>{this.state.clCommand}</span>
          </div>
          <div id='run-bundle-button'>
            {cancel_button}
            {run_button}
          </div>
        </div>
        {runBundleButton}
      </div>
      );
  }
});


var BundleBrowser = React.createClass({

  render: function () {
    var worksheet = this.props.ws.info;
    if (!worksheet || !worksheet.items) return <div />;

    var rows = [];
    worksheet.items.forEach(function(item) {
      if (item.bundles_spec) {
        item.bundles_spec.bundle_infos.forEach(function(b) {
          var url = "/bundles/" + b.uuid;
          var short_uuid = shorten_uuid(b.uuid);
          if (b.target_info && b.target_info.type === 'directory') {
            var fileBrowser = (
              <FileBrowser
                bundle_uuid={b.uuid}
                hasCheckbox={true}
                handleCheckbox={this.props.handleDependencySelection}
                bundle_name={b.metadata.name}
                startCollapsed={true}
                isRunBundleUIVisible={this.props.showBuilder}
              />
            );
            rows.push(
              <tr><td>{fileBrowser}</td></tr>
            );
          } else {
            rows.push(
              <tr>
                <td>
                  <input
                    type="checkbox"
                    className="run-bundle-check-box"
                    onChange={this.props.handleDependencySelection.bind(this, b.uuid, b.metadata.name, '')}
                  />
                  <a href={url} target="_blank">{b.metadata.name}({short_uuid})</a>
                </td>
              </tr>
            );
          }
        }.bind(this));
      }
    }.bind(this));

    if (rows.length === 0) {
      return (<div className='pop-up-text'>
        You do not have any bundles in this worksheet.
      </div>);
    }
    return (
      <div className="bundles-table">
          <table className="bundle-meta table">
              <tbody>
                {rows}
              </tbody>
          </table>
      </div>
    );
  }
});

var RunBundleTerminal = React.createClass({
  handleKeyUp: function(e) {
    if (e.keyCode === 13) {
      // ENTER clicks Run
      e.preventDefault();
      this.props.createRunBundle();
    } else if (e.keyCode === 27) {
      // ESC closes the window
      this.props.toggleBuilder();
    }
  },

  render: function () {
    var command = (<div className='run-bundle-terminal-item'>
      $ <input type='text' id='run-bundle-terminal-command' className='inline-block run-bundle-terminal-input' value={this.props.command} placeholder="date; echo hello" onChange={this.props.handleCommandChange} onKeyUp={this.handleKeyUp}></input>
    </div>
    );
    var depedencies = this.props.selectedDependencies.map(function(d, i) {
      var short_uuid = shorten_uuid(d.uuid);
      var target = d.path === '' ? d.bundle_name : d.bundle_name + '/' + d.path
      return (<div className='run-bundle-terminal-item'>
         <input type='text' className='run-bundle-terminal-input' value={this.props.dependencyKeyList[i]} onChange={this.props.handleKeyChange.bind(this, i)}></input>
          &#8594; {target}({short_uuid})
        </div>)
    }.bind(this));
    return (
      <div>
        <div className='run-bundle-terminal-item'>$ ls</div>
        {depedencies}
        {command}
      </div>
    );
  }
});
