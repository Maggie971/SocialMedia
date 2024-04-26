const User = require('../../model/user/User');

const myFriendsCtrl = async (req, res) => {
    try {
      const currentUser = req.session.userAuth;
      const user = await User.findById(currentUser).populate('friends', 'fullname profileImage');
  
      if (!user) {
        return res.status(404).json({ error: '未找到用户' });
      }
  
      res.render('friends/myFriends', { friends: user.friends }); // 将好友列表数据传递给模板进行渲染
    } catch (error) {
      console.error('获取用户好友时出错:', error);
      res.status(500).json({ error: '内部服务器错误' });
    }
  };

  const addFriendCtrl = async (req, res) => {
    try {
        const { userId } = req.params; // 从路由参数中获取 userId
        const currentUser = req.session.userAuth;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: '未找到用户' });
        }

        if (user.friends.includes(currentUser)) {
            return res.status(400).json({ error: '您已经是该用户的好友' });
        }

        user.friends.push(currentUser);
        await user.save();

        const currentUserObj = await User.findById(currentUser);
        currentUserObj.friends.push(userId);
        await currentUserObj.save();

        res.status(201).json({ message: '好友添加成功' }); // 返回 JSON 响应
    } catch (error) {
        console.error('添加好友时出错:', error);
        res.status(500).json({ error: '内部服务器错误' }); // 返回 JSON 错误响应
    }
};

module.exports = {
  myFriendsCtrl,
  addFriendCtrl,
};
