const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
  },
  coverImage: {
    type: String,
  },
  role: {
    type: String,
    default: "Blogger",
  },
  bio: {
    type: String,
    default: "Right here waiting",
  },
  address: {
    type: String,
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }], // 新添加的字段用于存储用户的聊天
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
