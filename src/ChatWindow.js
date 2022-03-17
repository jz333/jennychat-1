import React, { useEffect, useRef } from 'react';
import './ChatWindow.css';

//---------------------------------------------------------------//
// split the whole window into left pane and right pane
//---------------------------------------------------------------//
function SplitPane(props) {
  return (
    <div className="SplitPane">
      <div className="SplitPane-left">
        {props.left}
      </div>
      <div className="SplitPane-right">
        {props.right}
      </div>
    </div>

  );
}


//---------------------------------------------------------------//
// textarea component for user text input
// will submit by pressing 'Enter' key or click 'submit' button
//---------------------------------------------------------------//
class InputMsg extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputmsg : '',
      highlight: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleFileDrop = this.handleFileDrop.bind(this);

    this.handleFileLoad = this.handleFileLoad.bind(this);

  }

  handleChange(event) {
    this.setState({inputmsg: event.target.value});
  }

  handleSubmit(event) {
    // using dangerouslySetInnerHTML !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (this.state.inputmsg.trim() !== "") {
      this.props.connection.send("<strong>" + this.props.username + "</strong>" + " <em>"
                               + new Date().toLocaleTimeString() + "</em>: <br />" + this.state.inputmsg);
    };
    //console.log(this.state.inputmsg);
    event.preventDefault();

    this.setState({inputmsg: ''});
  }

  onKeyDown(event) {
    if (event.key === 'Enter') {
      this.handleSubmit(event);
    };
  }


  // drag files
  handleDragOver(event) {
    event.preventDefault();
  }

  handleDragEnter(event) {
    event.preventDefault();

    // change css style for textarea to "textarea-highligh" when drag enter
    this.setState({highlight: true});
  }

  handleDragLeave(event) {
    event.preventDefault();

    //change css style back to textarea
    this.setState({highlight: false});
  }

  // dragged and drop in the chat input textarea
  handleFileDrop(event) {
    event.preventDefault();

    // save to FileList files
    const files = event.dataTransfer.files

    //console.log(files);
    if (files.length) {
    this.handleFiles(files);
    };

    //change css style back to textarea
    this.setState({highlight: false});
  }


  // click the "Add Images" field - onChange handler for file input field
  handleFileLoad(event) {
    event.preventDefault();

    const files = event.target.files;
    //console.log(files);

    if (files.length) {
    this.handleFiles(files);
    };

  }

  // input files is a FileList - files selected by user on this one load
  handleFiles(files) {

    const uploadFile = (file) => {
      let url = 'http://localhost:4567/'; // according to path for backend - !!!!!!!!!!!!!!!!!!!!
                                          // here we still use wsServer instead of staticServer
      let formData = new FormData(); // create form data to send to the server

      //formData.append(file['name'], file);
      // find the last index of "."
      let indexofdot = file['name'].lastIndexOf(".");

      // set a new name for uploaded file
      let myFilename = Math.random().toString().slice(2) + file['name'].slice(indexofdot);
      //console.log(myFilename)
      formData.append(myFilename, file);

      // send the image to the server using "fetch"
      // deleted from headers:
      // 'Content-Type': 'multipart/form-data',
      fetch(url, {
        method: 'POST',
        body: formData,
        headers: {

        'Access-Control-Allow-Origin': '*'
        }
      })
      .then(() => {
        /* Done. Inform the user */
        console.log(file)

        // using dangerouslySetInnerHTML !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        let msg = "<strong>" + this.props.username + "</strong>" + " <em>" + new Date().toLocaleTimeString()
          + "</em>: <br /><br />"
          + "<img className='msgImage' src='http://localhost:4568/images/" + myFilename +
          "' alt='file preview'/>";

         console.log(msg);

        this.props.connection.send(msg);

        })
      .catch((e) => {
       /* Error. Inform the user */
       console.log("Error: " + e.reason)
       })

    };

    const validateFile = (file) => {
      const validTypes = ['image/jpeg', 'image/jpg,', 'image/png', 'image/gif', 'image/x-icon'];
      if (validTypes.indexOf(file.type) === -1) {
        return false;
      }
      return true;
    };

    // upload
    ([...files]).forEach((file) => {
      if (validateFile(file)) {
        uploadFile(file);
      } else {
        // invalid
        // set error message
        console.log("wrong file type selected!");
      }
    });

  }



  render() {
    return (
      <>
        <form onSubmit={this.handleSubmit}>
          <div className="drop-container"
            onDragOver={this.handleDragOver}
            onDragEnter={this.handleDragEnter}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleFileDrop}
          >
            <textarea value={this.state.inputmsg} onKeyDown={this.onKeyDown}
            placeholder="Write something..." onChange={this.handleChange}
            className={this.state.highlight ? "textarea-highlight" : "textarea"}/>
          </div>
          <input type="submit" value="Submit" />

          <div className="imgBtnArea">
            Add Images
            <input className="fileInput" type="file" title="" onChange={this.handleFileLoad}/>
          </div>
        </form>
      </>
    );
  }

}



//-------------------------------------------
// check if data (string) is base64 encoded
// this is used when an image file is uploaded
// and encoded as base64 string, and then sent
// through websocket and stored in message list.
function isBase64Image(data) {
  try {
    window.atob(data);
    return true;
  } catch (e) {
    return false;
  };
}
//-------------------------------------------





//---------------------------------------------------------------//
// Main chat window with websocket connection
//---------------------------------------------------------------//
class ChatWindow extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      messages : [],
      userList: [],
      username: localStorage.getItem( 'username' ),
      // instead of using username: props.username, use localStorage
      // so when you refresh ChatWindow, you still preserve the username state
    };
  }

  componentDidMount() {

    // handle WebSocket
    this.connectWS();

    // try {
    //} catch (error) {
    //}

  };

  // WebSocket connection setup
  connectWS(){
    // this is an 'echo' websocket service
    this.connection = new WebSocket('ws://localhost:4567/');


    // on open
    this.connection.onopen = () => {
      console.log('connected');

      this.setState({
        userList: this.state.userList.concat(this.state.username),
        messages : this.state.messages.concat("Connected to the chat room!")
      });

      // set username
      this.connection.send('set_display_username: '+ this.state.username);
    };

    // listen to on:message event
    this.connection.onmessage = evt => {
      if (evt.data.startsWith('add_to_userList: ')) {
        // special msg to update userList only
        // including users already in the chatroom and newly joined users
        this.setState({
          userList: this.state.userList.concat(evt.data.substring('add_to_userList: '.length))
        });
      } else if (evt.data.startsWith('delete_from_userList: ')) {
        // delete from userList
        this.setState({
          //use string.filter
          userList: this.state.userList.filter(item => item !== evt.data.substring('delete_from_userList: '.length))
        });
      } else {
        // all other msgs

        // add the new message to state
        this.setState({
          messages : this.state.messages.concat([evt.data])
        })
        //console.log('Received: '+ evt.data)

      };
    };


    // on close
    this.connection.onclose = e => {
      console.log('disconnected', e.reason)

    };

    // on error
    this.connection.onerror = err => {
      console.error(err.message);
      this.connection.close();
    };

    // test
    // setInterval(_ => {
    //   this.connection.send( Math.random())
    // }, 2000)
  };


  //   render() {
//     // slice(-5) gives us the five most recent messages
//     return <ul>{
//       this.state.messages.slice(-5).map(
//         (msg,idx) => <li key={'msg-' + idx}>{msg}</li>
//         )
//     }</ul>;
//   }



  // message list rendered on the chat area
  MessageList(props) {
    // using dangerouslySetInnerHTML !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    // check if the msg (a string) is base64 encoded
    // if yes, set img tag with
    // src={`data:image/jpg;base64,${props.value}`}
    let checkImage = isBase64Image(props.value);

    return <li>
      {checkImage
      ?
        <img
          className="preview"
          src={`data:image;base64,${props.value}`}
          alt={'file preview'}
        />
      :
      <div className="msgcontainer"
        dangerouslySetInnerHTML={{__html: props.value}}
      />
      }
      </li>;
  }


  // the rendering!!!!!
  render() {

    // special component as the last child of the 'message unordered list' component (ul)
    // (after the li's)
    // use React Hook useEffect to always scroll to the bottom of the list
    // set isMounted = true in useEffect then cleanup afterwards, see:
    // https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
    const AlwaysScrollToBottom = () => {
      const elementRef = useRef();

      useEffect(() => {
        let isMounted = true;
        elementRef.current.scrollIntoView();
        return (() => isMounted = false);
      });

      return <div ref={elementRef} />;
    };

      // {<li><img
      //               className="msgImage"
      //               src={'http://localhost:4568/images/mochi.png'}
      //               alt={'file preview'}
      //               /></li>}

      //let msgofimg = `<img className="msgImage" src='http://localhost:4568/images/mochi.png' alt='file preview'/>`;

    // slice(-5) gives us the five most recent messages
    return (
      <div className="ChatRoom">
        <SplitPane
          left={
            <div className="userList">
              <h3>In Chat room:</h3>
              <ul>{
                this.state.userList.map(
                  (user,idx) => <li key={'msg-' + idx}>{user}</li>
                )
              }</ul>
            </div>
          }
          right={
            <div className="ChatWindow">

              <div className="Chat">
                <ul>
                  {this.state.messages.map(
                    // (msg,idx) => <li key={'msg-' + idx}>{msg}</li>
                    // using dangerouslySetInnerHTML !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    // using MessageList defined above
                    (msg,idx) =>
                    <this.MessageList key={'msg-' + idx} value={msg} />
                  )}

                  <AlwaysScrollToBottom />
                </ul>
              </div>


              <div className="ChatInput">

                <InputMsg connection = {this.connection} username={this.state.username} />

              </div>


            </div>

          } />

      </div>
    );

  }


}


export default ChatWindow;
