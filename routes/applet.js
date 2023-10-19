const { errFile } = require('../untils/index')
const { default: axios } = require('axios');
var express = require('express');
var router = express.Router();

var mysql = require('mysql2');
var promisePool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'sys',
  connectionLimit: 10,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}).promise()

// 登录
router.post('/login', async function (req, res, next) {
  const res1 = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: {
      appid: 'wxaa43cb760218b79c', // AppID(小程序ID)
      secret: 'a39bd6e043188c372ddd55d9c92f65e2', // AppSecret(小程序密钥)	
      js_code: req.body.code,
      grant_type: 'authorization_code',
    }
  })
  if (!res1.data.errcode) {
    const [rows] = await promisePool.query(`select * from applet_user where openid = '${res1.data.openid}'`)
    if (!rows.length) {
      await promisePool.query(`insert into applet_user set openid = '${res1.data.openid}'`)
    }
    const data = { ...rows[0], token: rows[0].id }
    delete data.openid
    res.send({ code: 200, msg: '成功', data });
  } else {
    res.send({ code: 404, msg: '', data });
    errFile(res1.data)
  }
});
// 个人信息 获取
router.post('/userInfo', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const [rows] = await promisePool.query(`select * from applet_user where id = '${uid}'`)
    res.send({ status: 200, msg: '', data: rows[0] });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 设置 获取
router.post('/setting', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const [rows] = await promisePool.query(`select * from applet_setting where uid = ${uid}`)
    res.send({ status: 200, msg: '', data: rows[0] });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 设置 修改
router.post('/settingEdit', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const { musicSwitch, musicVolume, stopTime, runTime } = req.body
    const [rows] = await promisePool.query(`select * from applet_setting where uid = ${uid}`)
    const obj = {
      musicSwitch: musicSwitch ? musicSwitch : rows[0].musicSwitch,
      musicVolume: musicVolume ? musicVolume : rows[0].musicVolume,
      stopTime: stopTime ? stopTime : rows[0].stopTime,
      runTime: runTime ? runTime : rows[0].runTime,
    }
    await promisePool.query(`update applet_setting set musicSwitch='${obj.musicSwitch}', musicVolume='${obj.musicVolume}', stopTime='${obj.stopTime}', runTime='${obj.runTime}' where uid = ${uid}`)
    res.send({ status: 200, msg: '修改成功', });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 所有选项 获取
router.post('/options', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const [rows] = await promisePool.query(`select * from applet_options where uid = ${uid} and isDel = 0`)
    res.send({ status: 200, msg: '', data: rows });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 选项 添加
router.post('/optionsAdd', async function (req, res, next) {
  try {
    const { title, weight = 0, isDel = 0 } = req.body
    const uid = req.headers.token
    if (!title.trim()?.length) {
      res.status(500).send({ status: 400, msg: '选项名称不能为空' });
      return
    }
    await promisePool.query(`insert into applet_options (title, uid, weight, isDel) values ('${title}','${uid}','${weight}','${isDel}')`)
    res.send({ status: 200, msg: '新增成功', });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 选项 修改
router.post('/optionsEdit', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const { id, title } = req.body
    await promisePool.query(`update applet_options set title='${title}' where id = ${id} and uid = ${uid}`)
    res.send({ status: 200, msg: '修改成功', });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 选项 删除
router.post('/optionsDel', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const { ids } = req.body
    for (const id of ids) {
      await promisePool.query(`update applet_options set isDel = 1 where id = ${id} and uid = ${uid}`)
    }
    res.send({ status: 200, msg: '删除成功', });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 签到
router.post('/signIn', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const [rows] = await promisePool.query(`select * from applet_user where id = ${uid}`)
    await promisePool.query(`update applet_user set integral='${Number(rows[0].integral || 0) + 1}' where id = ${uid}`)
    res.send({ status: 200, msg: '修改成功', });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});
// 反馈
router.post('/feedback', async function (req, res, next) {
  try {
    const uid = req.headers.token
    const { message } = req.body
    await promisePool.query(`insert into applet_feedback (message, uid) values ('${message}','${uid}')`)
    res.send({ status: 200, msg: '提交成功', });
  } catch (error) {
    res.status(500).send({ status: 500, msg: error.sqlMessage });
  }
});

module.exports = router;
