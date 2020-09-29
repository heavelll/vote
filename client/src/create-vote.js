import React from 'react'
import { useArray, useInput, useBoolean } from 'react-hanger'
import axios from 'axios'
import moment from 'moment'
import 'moment/locale/zh-cn'
import { useHistory, useLocation } from 'react-router-dom'
import { Switch, Button } from 'antd'
import { LeftOutlined, MinusCircleFilled, PlusCircleFilled } from '@ant-design/icons'

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function CreateVote() {
  var query = useQuery();
  let history = useHistory();
  let options = useArray(['', ''])
  let title = useInput()
  let desc = useInput()
  let deadLine = useInput()
  let anonymous = useBoolean()
  let isMultiple = useBoolean(query.get('multiple') == 1 ? true : false)
  function handleDelete(index) {
    if(options.value.length > 2) {
      options.removeIndex(index);
    }
  }
  async function handlePost(e) {
    e.preventDefault();
    try {
      if(!title.value || !options.value || !deadLine.value) {
        alert('请填写必填项');
        return;
      }
      await axios.post('/vote', {
        title: title.value,
        desc: desc.value,
        options: options.value,
        deadLine: moment(deadLine.value).toISOString(),
        anonymous: anonymous.value ? 1 : 0,
        isMultiple: isMultiple.value ? 1 : 0
      })
      alert('创建成功')
      history.push(`/home/my`)
    } catch(e) {
      alert('创建失败');
    }
  }
  return (
    <div>
      <header>
        <span className="back" onClick={() => {window.history.go(-1)}}>
          <LeftOutlined />
        </span>
        {
          isMultiple.value
          ? '创建多选投票'
          : '创建单选投票'
        }
      </header>
      <div className="voteUpOuter">
        <div className="voteUpInner">
          <div>
            <input type="text" className="voteTitle voteInput" value={title.value} onChange={title.onChange} placeholder="投票标题"/>
          </div>
          <div>
            <input type="text" className="voteDesc voteInput" value={desc.value} onChange={desc.onChange} placeholder="描述内容(选填)"/>
          </div>
          <ul>
            {
              options.value.map((it, index) => {
                return (
                  <div key={index} className="optBox">
                    <MinusCircleFilled onClick={() => handleDelete(index)} className="dltadd dltBtn" style={{color: "red"}}/>
                    <input className="voteOpt voteInput" type="text" placeholder="选项" value={it} onChange={e => {options.setValue([...options.value.slice(0, index), e.target.value, ...options.value.slice(index + 1)])}}/>
                  </div>
                )
              })
            }
          </ul>
          <div className="addOpt" onClick={() => {options.push('')}} >
            <PlusCircleFilled style={{color: '#1890FF'}} className="dltadd" />
          </div>
        </div>
      </div>
      <div className="checkPart">
        <div className="checkInnerPart">
          <div className="checkBox">
            <span>截止日期</span> 
            <div className="checkInput">
              <input type="datetime-local" className="deadLine" value={deadLine.value} onChange={deadLine.onChange}/>
            </div>
          </div>
          <div className="checkBox">
            <span>匿名投票</span> 
            <div className="checkInput">
              <Switch checked={anonymous.value} onChange={anonymous.toggle}/>
            </div>
          </div>
          <div className="checkBox">
            <span>多选</span> 
            <div className="checkInput">
              <Switch checked={isMultiple.value} onChange={isMultiple.toggle}/>
            </div>
          </div>
          <div className="sendCreate">
            <Button style={{width: "70%"}} type="primary" size="large" onClick={handlePost}>创建</Button>
          </div>
        </div>
      </div>
    </div>
  )
}