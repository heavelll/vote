import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd';
import { NodeIndexOutlined, PartitionOutlined } from '@ant-design/icons'

export default function Create() {
  return (
    <>
    <div className="create">
      <NodeIndexOutlined className="createicon"/>
      <div>
        <Button size="large" style={{width: "70%"}} type="primary">
          <Link to="/create-vote">
            创建单选
          </Link>
        </Button>
      </div>
    </div>
    <div className="create">
      <PartitionOutlined className="createicon"/>
      <div>
        <Button size="large" style={{width: "70%"}} type="primary">
          <Link to="/create-vote?multiple=1">
            创建多选
          </Link>
        </Button>
      </div>
    </div>
    </>
  )
}