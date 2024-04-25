const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
  },
  { timestamps: true }
);

// 在 Chat 模型中添加一个静态方法来获取特定用户的聊天记录
chatSchema.statics.getChatsByUserId = async function (userId) {
  try {
    // 查询发送者或接收者是特定用户的聊天记录
    const chats = await this.find({ $or: [{ fromUser: userId }, { toUser: userId }] }).populate('fromUser toUser');
    return chats;
  } catch (error) {
    throw new Error('Error fetching chats by user ID');
  }
};

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
