import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link, useLocation, useHistory } from 'react-router-dom'
import { Button } from 'antd'

export default function My({setUserInfo}) {
  const [myVotes, setMyVotes] = useState(null);
  let history = useHistory()
  useEffect(() => {
    axios.get('/my').then(res => {
      setMyVotes(res.data);
    })
  }, [])
  function handleLogout() {
    axios.get('/logout').then(() => {
      history.push('/login');
      setUserInfo(null);
    })
  }
  return(
    <>
      <ul>
        {
          myVotes
          ? myVotes.votes.reverse().map(it => {
            return (
              <li key={it.id} className="voteList">
                <div><Link to={`/vote/${it.id}`}>{it.title}</Link></div>
              </li>
            )
          })
          : <li>loading...</li>
        }
      </ul>
      <div>
      <Button type="primary" danger onClick={handleLogout}>
        登出
      </Button>
      </div>
    </>
  )
}