const WebSocket = require('ws'); // 引入 WebSocket 模块
const Chat = require('/Users/yangmeizi/Desktop/MERNstack/final project/model/chat/Chat');
const User = require('/Users/yangmeizi/Desktop/MERNstack/final project/model/user/User');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });



module.exports = wss;
