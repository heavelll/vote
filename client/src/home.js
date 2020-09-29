import React from 'react'
import { Link, useRouteMatch, Route, Redirect, NavLink } from 'react-router-dom'
import Create from './create'
import My from './my'
import { AppstoreAddOutlined, UserOutlined } from '@ant-design/icons'

export default function Home({setUserInfo}) {
  let { path, url } = useRouteMatch()
  return (
    <>
      <Route path={`${url}/`} exact>
        <Redirect to={`${url}/create`}/>
      </Route>
      <Route path={`${url}/create`}>
        <header>
          创建投票
        </header>
        <content>
          <Create />
        </content>
      </Route>
      <Route path={`${url}/my`}>
        <header>
          我的投票
        </header>
        <content>
          <My setUserInfo={setUserInfo}/>
        </content>
      </Route>
      <footer>
        <NavLink to={`${url}/create`} className="nav" activeClassName="selected">
          <div>
            <AppstoreAddOutlined className="navicon"/>
          </div>
          <div>
            创建
          </div>
        </NavLink>
        <NavLink to={`${url}/my`} className="nav" activeClassName="selected">
          <div>
            <UserOutlined className="navicon"/>
          </div>
          <div>
            我的
          </div>
        </NavLink>
      </footer>
    </>
  )
}