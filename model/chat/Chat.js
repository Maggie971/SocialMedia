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
      enum: ["text"], // 只接受"text"类型的消息
      default: "text",
    },
  },
  { timestamps: true }
);

chatSchema.statics.getChatsByUserId = async function (userId) {
  try {
    const chats = await this.find({ $or: [{ fromUser: userId }, { toUser: userId }] }).populate('fromUser toUser');
    return chats;
  } catch (error) {
    throw new Error('Error fetching chats by user ID');
  }
};

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
