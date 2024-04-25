const Chat = require("../../model/chat/Chat");
const User = require("../../model/user/User");

const createChat = async (req, res) => {
  const { fromUser, toUser, message, messageType } = req.body;
  const { authorID } = req.query; // 获取作者ID

  try {
    // 创建聊天记录
    const chat = await Chat.create({
      fromUser,
      toUser: authorID, // 设置收信人为作者ID
      message,
      messageType,
    });

    // 将聊天记录添加到发送者和接收者的聊天列表中
    await User.findByIdAndUpdate(fromUser, { $push: { chats: chat._id } });
    await User.findByIdAndUpdate(authorID, { $push: { chats: chat._id } });

    res.status(201).json({ message: 'Chat created successfully', chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserChats = async (req, res) => {
  const { userId } = req.params;

  try {
    // 获取用户的聊天记录，并进行关联查询
    const user = await User.findById(userId).populate({
      path: 'chats',
      populate: [
        { path: 'fromUser', select: 'fullname profileImage' },
        { path: 'toUser', select: 'fullname profileImage' },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 整理聊天记录，根据聊天对象判断对方是谁
    const chats = user.chats.map(chat => {
      let chatPartner = chat.fromUser._id.equals(userId) ? chat.toUser : chat.fromUser;
      return {
        _id: chat._id,
        message: chat.message,
        messageType: chat.messageType,
        createdAt: chat.createdAt,
        chatPartner: {
          _id: chatPartner._id,
          fullname: chatPartner.fullname,
          profileImage: chatPartner.profileImage,
        },
      };
    });

    res.status(200).json({ chats });
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChatWindowsPage = (req, res) => {
  console.log("Received request for /chats/chatWindows");
  res.render("chats/chatWindows", { error: "" });
};

module.exports = {
  createChat,
  getUserChats,
  getChatWindowsPage,
};
