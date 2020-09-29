import React, { useState } from 'react';
import './App.css';
import { Switch, Route, useHistory, Redirect } from 'react-router-dom'
import 'antd/dist/antd.css'
import axios from 'axios'
import Home from './home'
import Login from './login'
import CreateVote from './create-vote'
import ViewVote from './ViewVote'
import Register from './register'

const { useEffect } = React

function App() {
  let history = useHistory();
  var [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    (async function() {
      await axios.get('/userInfo').then(res => {
        setUserInfo(res.data)
      }).catch(e => {
        console.log('用户未登录，将显示登录界面')
        if(window.location.hash === '#/register') {
          history.push('/register')
        } else {
          history.push('/login')
        }
      })
    })()
  }, [])


  return (
    <div className="App">
      <Switch>
        <Route path="/register">
          <Register />
        </Route>
        <Route path="/" exact>
          <Redirect to="/home" />
        </Route>
        <Route path="/home">
          {
            userInfo
            ? <Home setUserInfo={setUserInfo}/>
            : <Login  setUserInfo={setUserInfo}/>
          }
        </Route>
        <Route path="/login">
          <Login  setUserInfo={setUserInfo}/>
        </Route>
        <Route path="/create-vote">
          <CreateVote />
        </Route>
        <Route path="/vote/:id">
          <ViewVote userInfo={userInfo}/>
        </Route>
        
      </Switch>
    </div>
  );
}

export default App;
