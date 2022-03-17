import './Login.css';
import React, { useState, useRef } from 'react';
import { Route, Link, Routes, BrowserRouter, useNavigate } from 'react-router-dom'; //for page routing
import ChatWindow from './ChatWindow';
//import FileUpload from './file-upload/file-upload';  //test!!!!!!!!!!!!!!


// Login button linking to the chat room page "ChatWindow"
function LoginButton() {
  const navigate = useNavigate();

  function handleClick() {
    navigate("/ChatWindow");
  }

  return (
    <button type="button" onClick={handleClick}>Login</button>
  );
}

// //////////////////////////////////////////////
// //////////////////////////////////////////////
// // test file upload page!!!!!!!!!!!!!!!!!!!!!!
// function FileUploadPage() {
//   const [newUserInfo, setNewUserInfo] = useState({
//     profileImages: []
//   });

//   // update only the profileImages property and newUserInfo state
//   const updateUploadedFiles = (files) =>
//     setNewUserInfo({...newUserInfo, profileImages: files });


//   const handleSubmit = (event) => {
//     event.preventDefault();
//     // create a new user...

//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <FileUpload
//           accept=".jpg,.png,.jepg"
//           label="Profile Image(s)"
//           mutiple
//           updateFilesCb={updateUploadedFiles}
//         />
//         <button type="submit">Create New User</button>
//       </form>

//     </div>
//   );
// }
// //////////////////////////////////////////////
// //////////////////////////////////////////////



// Main parent component (highest hierarchy component) SPA
class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({username: event.target.value});
    // use localStorage to store username instead of passing down with prop!!!!
    localStorage.setItem('username', event.target.value);
  }

  handleSubmit(event) {
    console.log('username: ' + this.state.username);
    event.preventDefault();
  }


  // Child component 1: Login page
  LoginPage(props) {
    return (
      <div className='Login'>
        <form onSubmit={props.onSubmit}>
          <label className='username'>
            username:
            <br />
            <input type="text" value={props.value} onChange={props.onChange} />
            <br />
          </label>
          <LoginButton />
        </form>
      </div>
    );
  }

  // Child component 2: chat window page
  ChatPage(props) {
    return (
      <div className="ChatWindow">
        <ChatWindow username={props.username}/>
      </div>
    );
  }



  // return different component with different routing
  render() {
    return (
      <BrowserRouter>
        <div className="LoginPage">

          {/*<nav>
            <Link to="/ChatWindow" as={NavLink}>Chat room</Link>
            <br />
            <Link to="/">Login</Link>
          </nav>*/}

          <Routes>
            <Route path="/" element={
              <this.LoginPage onSubmit={this.handleSubmit} onChange={this.handleChange}
              value={this.state.username} /> } />
            <Route path="/ChatWindow" element={<this.ChatPage username={this.state.username}/>} />

            {/*test!!!!!!!!!!//////////////////////////////*/}
            {/*<Route path="/file-upload/FileUpload" element={<FileUploadPage />} /> */}
            {/*test!!!!!!!!!!//////////////////////////////*/}
          </Routes>

        </div>
      </BrowserRouter>

    );
  }

}

export default Main;
