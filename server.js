const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const globalErrHandler = require("./middlewares/globalHandler");
const commentRoutes = require("./routes/comments/comment");
const postRoutes = require("./routes/posts/posts");
const userRoutes = require("./routes/users/users");
const Chat = require("./model/chat/Chat");
const mongoose = require("mongoose");
const Post = require("./model/post/Post");
const User = require("./model/user/User");
const { truncatePost } = require("./utils/helpers");
const path = require('path');
const multer = require('multer');

require("dotenv").config();
require("./config/dbConnect");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.locals.truncatePost = truncatePost;

app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "font-src 'self' https://fonts.gstatic.com");
  next();
});

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      ttl: 24 * 60 * 60,
    }),
  })
);

app.use((req, res, next) => {
  if (req.session.userAuth) {
    res.locals.userAuth = req.session.userAuth;
  } else {
    res.locals.userAuth = null;
  }
  next();
});

// 设置 Multer 中间件以处理文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post("/chats", upload.single('messageImage'), async (req, res) => {
  try {
    const { fromUser, toUser, postId, messageText, messageType } = req.body;
    let message;

    // 如果消息类型是图片，则将图片文件保存到服务器，并将图片路径作为消息内容
    if (messageType === 'image' && req.file) {
      // 处理上传的图片文件
      const imagePath = req.file.path;
      message = imagePath;
    } else {
      // 否则，消息内容就是文本消息
      message = messageText;
    }

    // 创建聊天记录并保存到数据库
    const chat = await Chat.create({
      fromUser,
      toUser,
      postId,
      message,
      messageType,
    });

    // 返回创建的聊天记录
    res.json({ message: chat.message });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("user");
    res.render("index", { posts });
  } catch (error) {
    res.render("index", { error: error.message });
  }
});

app.get("/chats/chatWindows", async (req, res) => {
  try {
    // 从查询参数中获取用户的 ID
    const userId = req.query.userId;

    // 获取特定用户的聊天记录
    const chats = await Chat.getChatsByUserId(userId);

    // 将获取到的聊天记录传递给模板文件
    res.render("chats/chatWindows", { chats });
  } catch (error) {
    // 如果发生错误，可以渲染一个错误页面或者返回一个错误消息
    res.status(500).send("Internal Server Error");
  }
});

// WebSocket connection handler
wss.on("connection", (ws) => {
  // Handle incoming messages
  ws.on("message", async (message) => {
    try {
      // Process the message and save it to the database
      const parsedMessage = JSON.parse(message);
      const { fromUser, toUser, postId, messageText, messageType } = parsedMessage;
      
      // Save the message to the database
      const chat = await Chat.create({
        fromUser,
        toUser,
        postId,
        message: messageText,
        messageType,
      });

      // Broadcast the message to all clients
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

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/comments", commentRoutes);

app.use(globalErrHandler);

const PORT = process.env.PORT || 8987;
server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

// Connect to the database
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));
