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
const friendsRoutes = require("./routes/friends/friends"); 
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
app.post("/api/v1/chats", async (req, res) => {
  try {
    const { fromUser, toUser, message } = req.body;
    const messageType = 'text'; // 强制消息类型为"text"

    // 创建新的聊天记录
    const newChat = await Chat.create({
      fromUser,
      toUser,
      message,
      messageType,
    });

    res.json({ message: newChat.message });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.get("/api/v1/posts", async (req, res) => {
  try {
    const posts = await Post.find().populate("user");
    res.render("index", { posts });
  } catch (error) {
    res.render("index", { error: error.message });
  }
});

app.get("/api/v1/chats/chatWindows/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const chats = await Chat.getChatsByUserId(userId);
    res.render("chats/chatWindows", { chats });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

wss.on("connection", (ws) => {
  ws.on("message", async (data) => {
    try {
      // 添加对数据类型的检查
      if (typeof data === 'string') {
        const { fromUser, toUser, message, messageType } = JSON.parse(data);
        const chat = await Chat.create({
          fromUser,
          toUser,
          message,
          messageType,
        });
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(chat));
          }
        });
      } else {
        console.error("Invalid data type received:", typeof data);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

app.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("user");
    res.render("index", { posts });
  } catch (error) {
    res.render("index", { error: error.message });
  }
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/friends", friendsRoutes);

app.use(globalErrHandler);

const PORT = process.env.PORT || 8987;
server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));
