const WebSocket = require('ws'); // 引入 WebSocket 模块
const Chat = require('/Users/yangmeizi/Desktop/MERNstack/final project/model/chat/Chat');
const User = require('/Users/yangmeizi/Desktop/MERNstack/final project/model/user/User');

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 });

// 在服务器连接上时处理消息
wss.on("connection", (ws) => {
  // 处理收到的消息
  ws.on("message", async (data) => {
    try {
      const { fromUser, toUser, message, messageType } = JSON.parse(data);
      
      const chat = await Chat.create({
        fromUser,
        toUser,
        message,
        messageType,
      });

      // 将消息广播给所有客户端
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(chat));
        }
      });
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });
});

module.exports = wss;
