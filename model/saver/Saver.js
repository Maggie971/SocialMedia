const mongoose = require("mongoose");

const saverSchema = new mongoose.Schema(
  {
    // 用户ID，用于关联用户
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    // 收藏的帖子信息，这里只需要存储帖子的ID
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post", 
        required: true,
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Saver = mongoose.model("Saver", saverSchema);

module.exports = Saver;
