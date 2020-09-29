import React, { useRef } from 'react'
import axios from 'axios'
import { useHistory, Link } from 'react-router-dom'
import { Input, Space, Button } from 'antd';
import { UserOutlined, EyeInvisibleOutlined, EyeTwoTone, LockOutlined } from '@ant-design/icons';


export default function Login({setUserInfo}) {
  let history = useHistory();
  let nameRef = useRef()
  let passwordRef = useRef()
  async function handleLogin(e) {
    e.preventDefault();
    try {
      let res = await axios.post('/login', {
        name: nameRef.current.state.value,
        password: passwordRef.current.state.value
      })
      setUserInfo(res.data);

      history.push('/home')
    } catch(e) {
      alert(e.response.data.msg.toString());
    }
  }

  return (
    <div>
      <header>登录</header>
      <div className="inputzone">
        <div>
          <Input placeholder="请输入用户名" className="login" prefix={<UserOutlined />} ref={nameRef}/>
        </div>
        <br />
        <div>
          <Input.Password className="login" prefix={<LockOutlined />} placeholder="请输入密码" ref={passwordRef}/>
        </div>
        <br />
        <Button size="large" style={{width: "70%"}} type="primary" onClick={handleLogin}>登录</Button>
      </div>
      <div className="regInLog">
        <Link to="/register">注册帐号</Link>
      </div>
    </div>
  )
}


