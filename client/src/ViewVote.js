import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import './ViewVote.css'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { groupBy, uniqBy } from 'lodash'
import { LeftOutlined } from '@ant-design/icons'

export default function ViewVote({ userInfo }) {
  let { id } = useParams();
  // console.log(id.id)
  let [loading, setLoading] = useState(true);
  let [voteInfo, setVoteInfo] = useState(null);
  let [votings, setVotings] = useState(null);

  if(!loading) {
    var groupedVotings = groupBy(votings, 'optionId');
    var uniqUsersCount = uniqBy(votings, 'userId').length;
  }

  useEffect(() => {
    setVoteInfo(null);
    setLoading(true);
    axios.get(`/vote/${id}`).then(res => {
      setVoteInfo(res.data.data);
      
      setVotings(res.data.data.votings);

      setLoading(false);
    })
  }, [id])

  useEffect(() => {
    if(!voteInfo) {
      return;
    }
    if(moment(voteInfo.deadLine).isAfter(new Date().toISOString())) {
      var ws = new WebSocket(`wss://${window.location.host}/vote/${id}`);
      ws.onmessage = e => {
        setVotings(JSON.parse(e.data));
      }
      return () => ws.close()
    }
  }, [id, voteInfo])

  async function voteUp(optionId, hasVoted) {
    //已过deadline
    if(moment(voteInfo.deadLine).isBefore(new Date().toISOString())) {
      alert('该投票已过期，不能再进行投票');
      return;
    }
    // if(!hasVoted) {
    //   var thisVoting = {
    //     id: -1,
    //     optionId: optionId,
    //     voteId: id,
    //     userId: userInfo.id,
    //     avatar: userInfo.avatar
    //   }
    //   setVotings([...votings, thisVoting]);
    // } else {
    //   var filterVotings = votings.filter(it => {
    //     return !(it.userId === userInfo.id && optionId === it.optionId);
    //   })
    //   setVotings(filterVotings);
    // }

    await axios.post(`/voteup/${id}`, {
      optionId,
      isVoteDown: hasVoted
    }).then(res => {
      // console.log(res.data);
    })
  }


  if(loading) {
    return (
      <div>loading...</div>
    )
  }

  return (
    <div className="viewVote">
      
      <header>
        <span className="back" onClick={() => {window.history.go(-1)}}>
          <LeftOutlined />
        </span>
        进行投票
      </header>
      <div className="voteHead">
        <h2>{voteInfo.title}</h2>
        <p>{voteInfo.desc} <span>{voteInfo.isMultiple ? '[多选]' : '[单选]'}</span></p>
      </div>
      <ul>
        {
          voteInfo.options.map(option => {
            var currVotings = groupedVotings[option.id] || [];
            if(userInfo) {
              
              var hasCurrUserVoted = !!currVotings.find(it => it.userId === userInfo.user.id);
              
            }
            return (
            <li key={option.id}>
              <div className="innerVote">
                {
                  userInfo
                  ? (
                  <>
                    <div className="outerVote" onClick={() => voteUp(option.id, hasCurrUserVoted)}>
                      <div className="voteLine">
                        {
                          hasCurrUserVoted && 
                          <span className="checkIdt"></span>
                        }
                        <input type='checkbox' checked={hasCurrUserVoted} onChange={() => {}} />
                        <span className='voteContent'>{option.content}</span>
                        <span className="statistic">{currVotings.length}票 {calcRatio(currVotings.length, uniqUsersCount)}%</span>
                      </div>
                    </div>
                    <div className="option-ratio" style={{width: calcRatio(currVotings.length, uniqUsersCount) + '%'}}></div>
                    <div className="avatarZone">
                      {
                        currVotings.map((currVoting, idx) => {
                          return (
                            <img src={currVoting.avatar} key={idx} className="avatar"></img>
                          )
                        })
                      }
                    </div>
                  </>
                  )
                  : <div>loading...</div>
                }
              </div>
            </li>
            )
          })
        }
      </ul>
      {
        moment(voteInfo.deadLine).isBefore(new Date().toISOString()) &&
        <div className="deadLine">(已过期)</div>
      }
      <span className='deadLine'>投票截止至: {moment(voteInfo.deadLine).format('LLLL')}</span>
    </div>
  )
}

function calcRatio(num, base) {
  if(base === 0) {
    return 0;
  }
  return (num / base * 100).toFixed();
}
