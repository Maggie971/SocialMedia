const express = require('express');
const router = express.Router();
const { myFriendsCtrl, addFriendCtrl } = require('../../controllers/friends/friends');
const protected = require("../../middlewares/protected");

// 获取用户的好友列表
router.get('/my-friends', myFriendsCtrl);

// 添加好友
router.post('/add-friend/:userId', addFriendCtrl); // 注意此处路由定义

module.exports = router;
