const express = require("express")
const cookieParser = require("cookie-parser")
const multer = require("multer")
const fsp = require("fs").promises
const svgCaptcha = require("svg-captcha")
const path = require("path")
const cors = require('cors')
const app = express()
const PORT = 8888
const moment = require('moment');
// import moment from 'moment'
// import 'moment/locale/zh-cn'
require('moment/locale/zh-cn')
let uploader = multer({ dest: 'uploads/' });
const http = require('http')
const WebSocket = require('ws')

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

//当前已建立的websocket的映射
var voteIdMapWs = {}

wss.on('connection', (ws, req) => {
  console.log('someone in')
  var voteId = req.url.split('/').slice(-1)[0];
  console.log('将会把投票', voteId, '的实时信息发送到客户端');
  
  var voteInfo = db.get('SELECT rowid AS id, * FROM votes WHERE id = ?', voteId);
  if(moment(voteInfo.deadLine).isBefore(new Date().toISOString())) {
    ws.close();
  }
  if(voteId in voteIdMapWs) {
    voteIdMapWs[voteId].push(ws);
  } else {
    voteIdMapWs[voteId] = [ws];
  }

  ws.on('close', () => {
    voteIdMapWs[voteId] = voteIdMapWs[voteId].filter(it => it !== ws);
  })
})

let db;

require('./vote.js').then(value => {
  db = value;
})

app.use(cors())
app.locals.pretty = true
app.use(express.static(__dirname + '/build'))
app.use(express.static(__dirname + '/static'))
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser('ah4bk5asd23tojg9as'))

let sessionStore = Object.create(null);

//session
app.use(function sessionMW(req, res, next) {
  if(req.cookies.sessionId) {
    req.session = sessionStore[req.cookies.sessionId];
    if(!req.session) {
      req.session = sessionStore[req.cookies.sessionId] = {};
    }
  } else {
    let id = Math.random().toString(16).slice(2);
    
    req.session = sessionStore[id] = {};
    res.cookie('sessionId', {
      maxAge: 86400000
    })
  }
  next();
})

app.use(async (req, res, next) => {
  console.log(req.method, req.url);
  //获取cookie是否已签名
  if(req.signedCookies.user) {
    //从签名的cookie中读出用户名将该用户信息存入req.user中以便后续使用
    req.user = await db.get('SELECT rowid as id, * FROM users WHERE name = ?', req.signedCookies.user);
  }
  next();
})

// 创建投票
app.post('/vote', async (req, res, next) => {
  if(req.user) {
    var voteInfo = req.body;
    await db.run('INSERT INTO votes VALUES (?, ?, ?, ?, ?, ?, ?)',
    [voteInfo.title, voteInfo.desc, req.user.id, voteInfo.deadLine, 
      voteInfo.anonymous, new Date().toISOString(), voteInfo.isMultiple])
    let vote = await db.get('SELECT rowid AS id, * FROM votes ORDER BY id DESC LIMIT 1')
    for(var option of voteInfo.options) {
      await db.run(
        'INSERT INTO options VALUES (?, ?, ?)',
        [vote.id, option, 0]
      )
    }
    console.log('接到创建请求')
    res.json({
      voteId: vote.id
    })
  } else {
    res.status(401).json({
      code: -1,
      msg: '请先登录'
    })
  }
})
/
//查看投票
app.get('/vote/:id', async (req, res, next) => {
  let id = req.params.id;
  try {
    let vote = await db.get("SELECT rowid AS id, * FROM votes WHERE id = ?", id);
    let votings = await db.all('SELECT votings.rowid as id, votings.*, users.name, users.avatar FROM votings JOIN users ON users.rowid = votings.userId WHERE voteId = ?', id);
    let options  =  await db.all("SELECT rowid as id, * FROM options WHERE voteId = ?", id);
    
    vote.votings = votings;
    vote.options = options;
    res.json({
      code: 0,
      data: vote
    })
  } catch(e) {
    res.json({
      code: -1,
      msg: '请求失败'
    })
  }
})

//进行投票
app.post('/voteup/:voteId', async (req, res, next) => {
  if(req.user) {
    let body = req.body;
    let voteId = req.params.voteId;
    let vote = await db.get("SELECT rowid AS id, * FROM votes WHERE id = ?", voteId);
    let timeNow = moment().format();
    let timeEnd = moment(vote.deadLine).format();
    if(moment(timeEnd).isBefore(timeNow)) {
      res.status(401).end({
        code: -1,
        msg: '该问题已过截止日期，不能再投票'
      })
    }

    if(!vote.isMultiple) {
      //如果是单选
      await db.run('DELETE FROM votings WHERE userId = ? AND voteId = ?', [req.user.id, voteId]);
      if(!req.body.isVoteDown) {
        await db.run('INSERT INTO votings values (?, ?, ?)', [voteId, body.optionId, req.user.id]);
      }
      res.end()
    } else {
      //如果是多选
      await db.run('DELETE FROM votings WHERE voteId= ? AND optionId = ? AND userId = ?', [voteId, body.optionId, req.user.id]);
      if(!req.body.isVoteDown) {
        await db.run('INSERT INTO votings values (?, ?, ?)', [voteId, body.optionId, req.user.id]);
      }
      res.end();
    }
    let votings = await db.all('SELECT votings.rowid as id, votings.*, users.name, users.avatar FROM votings JOIN users ON users.rowid = votings.userId WHERE voteId = ?', voteId);
    var websockets = voteIdMapWs[voteId] || [];
    for(var ws of websockets) {
      ws.send(JSON.stringify(votings));
    }
  } else {
    res.status(401).json({
      code: -1,
      msg: '请先登录'
    })
  }
})
//登出
app.get('/logout', (req, res, next) => {
  res.clearCookie('user');
  res.end()
})

//登录页route
app.post('/login', async (req, res, next) => {
  let body = req.body;


  //验证码比对验证
  // if(req.body.captcha !== req.session.captcha) {
  //   res.json({
  //     code: -1,
  //     reason: '验证码错误'
  //   })
  //   return
  // }

  var user = await db.get('SELECT rowid as id, * FROM users WHERE name = ? AND password = ?', [body.name, body.password]);

  // console.log(user);
  // let user = users.find(it => it.name === body.name && it.password === body.password);

  if(user) {
    res.cookie('user', user.name, {
      maxAge: 86400000,
      signed: true
    });
    res.json({
      code: 0,
      user: user
    })
  } else {
    res.status(401).json({
      code: -1,
      msg: '用户名或密码错误,请重新登录'
    })
  }
})

//获取用户创建投票
app.get('/my', async (req, res, next) => {
  if(req.user) {
    let votes = await db.all('SELECT rowid AS id, * FROM votes WHERE userId = ?', req.user.id);
    res.json({
      code: 0,
      votes: votes
    })
  } else {
    res.status(404).json({
      code: -1,
      msg: '请先登录'
    })
  }
})

//获取用户信息
app.get('/userInfo', (req, res, next) => {
  if(req.user) {
    res.json({
      user: req.user
    })
  } else {
    res.status(404).json({
      code: -1,
      msg: '请先登录'
    })
  }
})

//验证码
app.get('/captcha', async (req, res, next) => {
  var captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;
  
  res.type('svg');
  res.status(200).send(captcha.data);
})

//用户页
app.get('/person/:id', async(req, res, next) => {
  let exist = await db.get('select * from users where users.rowid = ?', req.params.id);
  if(exist) {
    if(req.user) {
      if(req.user.id == req.params.id) {
        let main = await db.get('select rowid as id, name, email, avatar from users where rowid = ?', req.params.id);
        let posts = await db.get('select postInfo.rowid as postId, postInfo.title, postInfo.createAt from users join postInfo where users.rowid = postInfo.ownerId and users.rowid = ? ORDER BY postInfo.rowid DESC')
        let comments = await db.get('select comments.content as comment, postInfo.title, postInfo.rowid as postId from users join comments join postInfo where users.rowid = ? and users.rowid = comments.ownerId and comments.replyTo = postInfo.rowid ORDER BY comments.rowId DESC', req.params.id);
        res.render('person.pug', {
          code: 0,  //已登录，发送code0标识
          main: main,
          posts: posts,
          comments: comments
        })
      } else {
        let main = await db.get('select rowid as id, name, email, avatar from users where rowid = ?', req.params.id);
        let posts = await db.get('select postInfo.rowid as postId, postInfo.title, postInfo.createAt from users join postInfo where users.rowid = postInfo.ownerId and users.rowid = ? ORDER BY postInfo.rowid DESC');
        let comments = await db.get('select comments.content as comment, postInfo.title, postInfo.rowid as postId from users join comments join postInfo where users.rowid = ? and users.rowid = comments.ownerId and comments.replyTo = postInfo.rowid ORDER BY comments.rowId DESC', req.params.id);
        
        res.render('person.pug', {
          code: 0,
          main: main,
          posts: posts,
          comments: comments
        })
      }
    } else {
      let main = await db.get('select rowid as id, name, email, avatar from users where rowid = ?', req.params.id);
      let posts = await db.get('select postInfo.rowid as postId, postInfo.title, postInfo.createAt from users join postInfo where users.rowid = postInfo.ownerId and users.rowid = ? ORDER BY postInfo.rowid DESC');
      let comments = await db.get('select comments.content as comment, postInfo.title, postInfo.rowid as postId from users join comments join postInfo where users.rowid = ? and users.rowid = comments.ownerId and comments.replyTo = postInfo.rowid ORDER BY comments.rowId DESC', req.params.id);
      
      res.render('person.pug', {
        code: 1,  //未登录 发送code1标识
        main: main,
        posts: posts,
        comments: comments
      })
    }
  } else {
    res.status(404);
    res.render('404.pug');
  }
})

//注册页route
app.route('/register')
.post(uploader.single('avatar'), async (req, res, next) => {
  // console.log(req.body)
  let body = req.body;
  let file = req.file;
  let avatarPath;
  if(file) {
    let newName = file.path + '-' + file.originalname;
    await fsp.rename(file.path, newName);
    avatarPath = '/uploads/' + path.basename(newName);
  } else {
    avatarPath = '/uploads/avatar.png';
  }
  try {
    await db.run('insert into users values (?, ?, ?, ?)', [body.name, body.password, body.email, avatarPath]);
    res.json({
      msg: '注册成功',
      code: 0
    })
  } catch(e) {
    res.json({
      msg: '注册失败',
      code: -1
    })
  }
  // body.createAt = Date.now();
})

//重名检测
app.post('/conflict/name', async (req, res, next) => {
  let body = req.body;
  if(!body.name) {
    res.json({
      code: -1,
      msg: '用户名不能为空'
    })
  }
  if(body.name) {
    let dbName = await db.get('SELECT * FROM users WHERE name = ?', body.name);
    if(dbName) {
      res.json({
        code: -1,
        msg: '此用户名已被占用'
      })
    } else {
      res.json({
        code: 0,
        msg: '此用户名可用'
      })
    }
  }
})

//重邮箱检测
app.post('/conflict/email', async (req, res, next) => {
  let body = req.body;
  let exp = /^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$/;
  if(!exp.test(body.email)) {
    res.json({
      code: -1,
      msg: '请输入有效的邮箱地址'
    })
  }
  try {
    if(body.email) {
      let dbEmail = await db.get('SELECT * FROM users WHERE email = ?', body.email);
      if(dbEmail) {
        res.json({
          code: -1,
          msg: '此邮箱已被注册'
        })
      } else {
        res.json({
          code: 0,
          msg: '此邮箱可以注册'
        })
      }
    }
  } catch(e) {

  }
})

server.listen(PORT, () => {
  console.log('listen on port', PORT);
  console.log(moment().format('LLLL'));
})