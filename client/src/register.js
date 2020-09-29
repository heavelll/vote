import React, { useRef, useState } from 'react'
import { Input, Button, Upload, message } from 'antd'
import { LockOutlined, UserOutlined, LoadingOutlined, PlusOutlined, MailOutlined } from '@ant-design/icons'
import { useHistory, Link } from 'react-router-dom';
import _ from 'lodash';
import axios from 'axios';

export default function Register() {
  let history = useHistory();
  let nameRef = useRef();
  let emailRef = useRef();
  let passwordRef = useRef();
  let avatarRef = useRef();
  let [conName, setConName] = useState();
  let [conEmail, setConEmail] = useState();
  let fileAvatar = {};


  async function handleRegister() {

    if (!conName || !passwordRef.current.state.value || !conEmail || conName.code || conEmail.code) {
      alert('注册失败，请重新填写');
      return;
    }
    var formData = new FormData();
    formData.append('name', nameRef.current.state.value);
    formData.append('password', passwordRef.current.state.value);
    formData.append('email', emailRef.current.state.value);
    formData.append('avatar', fileAvatar.file);
    await axios.post('register', formData).then(res => {
      alert(res.data.msg);
      history.push('/login');
    }).catch(reason => {
      alert(reason)
    })
  }



  async function conflictNameNotD(e) {
    // let exp = /^[a-z]$|^[1-9_]$|^Backspace$/;
    // if (exp.test(e.key)) {
    await axios.post('/conflict/name', {
      name: nameRef.current.state.value
    }).then(res => {
      setConName(res.data);
    }).catch(reason => {
      
    })
    // }
  }

  async function conflictEmailNotD(e) {
    // let exp = /^[a-z]$|^[1-9_]$|^Backspace$/;
    // if (exp.test(e.key)) {
      await axios.post('/conflict/email', {
        email: emailRef.current.state.value
      }).then(res => {
        setConEmail(res.data);
      }).catch(reason => {
        
    })
    // }
  }
  
  var conflictName = _.debounce(conflictNameNotD, 1000);
  var conflictEmail = _.debounce(conflictEmailNotD, 1000);

  function getBase64(img, callback) {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  }

  function beforeUpload(file) {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    fileAvatar.file = file;
    return isJpgOrPng && isLt2M;
  }

  class Avatar extends React.Component {
    state = {
      loading: false,
    };

    handleChange = info => {
      if (info.file.status === 'uploading') {
        this.setState({ loading: true });
        return;
      }
      if (info.file.status === 'done') {
        // Get this url from response in real world.
        getBase64(info.file.originFileObj, imageUrl =>
          this.setState({
            imageUrl,
            loading: false,
          }),
        );
      }
    };

    render() {
      const { loading, imageUrl } = this.state;
      const uploadButton = (
        <div>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      );
      return (
        <Upload
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
          beforeUpload={beforeUpload}
          onChange={this.handleChange}
        >
          {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
        </Upload>
      );
    }
  }


  return (
    <div>
      <header>注册</header>
      <div className="inputzone">
        <div>
          <Input placeholder="请输入用户名" onKeyUp={conflictName} className="login" prefix={<UserOutlined />} ref={nameRef} />
        </div>
        {
          conName
            ? <span className={conName.code ? "con" : "notCon"}>{conName.msg}</span>
            : <br />
        }
        <div>
          <Input.Password className="login" prefix={<LockOutlined />} placeholder="请输入密码" ref={passwordRef} />
        </div>
        <br />
        <div>
          <Input placeholder="请输入邮箱" onKeyUp={conflictEmail} className="login" prefix={<MailOutlined />} ref={emailRef} />
        </div>
        {
          conEmail
            ? <span className={conEmail.code ? "con" : "notCon"}>{conEmail.msg}</span>
            : <br />
        }
        <div>
          上传头像:
          <Avatar ref={avatarRef} />
          <br />
        </div>
        <Button size="large" style={{ width: "70%" }} type="primary" onClick={handleRegister}>注册</Button>
      </div>
      <div className="regInLog">
        <Link to="/login">去登陆</Link>
      </div>
    </div>
  )
}
