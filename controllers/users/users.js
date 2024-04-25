const bcrypt = require("bcryptjs");
const User = require("../../model/user/User");
const appErr = require("../../utils/appErr");
const Saver = require("../../model/saver/Saver");

const registerCtrl = async (req, res, next) => {
  const { fullname, email, password } = req.body;
  if (!fullname || !email || !password) {
    return res.render("users/register", {
      error: "All fields are required",
    });
  }
  try {
    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.render("users/register", {
        error: "Email is taken",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const passswordHashed = await bcrypt.hash(password, salt);
    const user = await User.create({
      fullname,
      email,
      password: passswordHashed,
    });

    await Saver.create({ user: user._id, posts: [] });

    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    res.json(error);
  }
};

const savePostToSaverCtrl = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.session.userAuth;

    let userSaver = await Saver.findOne({ user: userId });

    if (!userSaver) {
      userSaver = new Saver({ user: userId });
    }

    userSaver.posts.push(postId);
    await userSaver.save();

    res.status(201).json({ message: "Post saved to saver successfully." });
  } catch (error) {
    console.error("Error saving post to saver:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const fetchSaverCtrl = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const saver = await Saver.findOne({ user: userId }).populate('posts');
    if (!saver) {
      return next(appErr("Saver not found", 404));
    }

    res.json({
      status: "success",
      data: saver.posts,
    });
  } catch (error) {
    next(appErr(error.message));
  }
};

const deleteSaverCtrl = async (req, res, next) => {
  const { userId, postId } = req.params;
  try {
    const saver = await Saver.findOne({ user: userId });
    if (!saver) {
      return next(appErr("Saver not found", 404));
    }

    // Remove the post from saver
    saver.posts = saver.posts.filter(item => item.toString() !== postId);
    await saver.save();

    res.status(200).json({
      status: "success",
      message: "Post removed from saver",
    });
  } catch (error) {
    next(appErr(error.message));
  }
};

const loginCtrl = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render("users/login", {
      error: "Email and password fields are required",
    });
  }
  try {
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.render("users/login", {
        error: "Invalid login credentials",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, userFound.password);
    if (!isPasswordValid) {
      return res.render("users/login", {
        error: "Invalid login credentials",
      });
    }
    req.session.userAuth = userFound._id;
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    res.json(error);
  }
};

const userDetailsCtrl = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    res.render("users/updateUser", {
      user,
      error: "",
    });
  } catch (error) {
    res.render("users/updateUser", {
      error: error.message,
    });
  }
};

const profileCtrl = async (req, res) => {
  try {
    const userID = req.session.userAuth;
    const user = await User.findById(userID)
      .populate("posts")
      .populate("comments");
    res.render("users/profile", { user });
  } catch (error) {
    res.json(error);
  }
};

const uploadProfilePhotoCtrl = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.render("users/uploadProfilePhoto", {
        error: "Please upload image",
      });
    }
    const userId = req.session.userAuth;
    const userFound = await User.findById(userId);
    if (!userFound) {
      return res.render("users/uploadProfilePhoto", {
        error: "User not found",
      });
    }
    const userUpdated = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: req.file.path,
      },
      {
        new: true,
      }
    );
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    return res.render("users/uploadProfilePhoto", {
      error: error.message,
    });
  }
};

//update password
const updatePasswordCtrl = async (req, res, next) => {
  const { password } = req.body;
  try {
    //Check if user is updating the password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passswordHashed = await bcrypt.hash(password, salt);
      //update user
      await User.findByIdAndUpdate(
        req.session.userAuth,
        {
          password: passswordHashed,
        },
        {
          new: true,
        }
      );
      //redirect
      res.redirect("/api/v1/users/profile-page");
    }
  } catch (error) {
    return res.render("users/uploadProfilePhoto", {
      error: error.message,
    });
  }
};

//update user
const updateUserCtrl = async (req, res, next) => {
  const { fullname, email } = req.body;
  try {
    if (!fullname || !email) {
      return res.render("users/updateUser", {
        error: "Please provide details",
        user: "",
      });
    }
    //Check if email is not taken
    if (email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.render("users/updateUser", {
          error: "Email is taken",
          user: "",
        });
      }
    }
    //update the user
    await User.findByIdAndUpdate(
      req.session.userAuth,
      {
        fullname,
        email,
      },
      {
        new: true,
      }
    );
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    return res.render("users/updateUser", {
      error: error.message,
      user: "",
    });
  }
};

//logout
const logoutCtrl = async (req, res) => {
  //destroy session
  req.session.destroy(() => {
    res.redirect("/api/v1/users/login");
  });
};

const viewSaverCtrl = async (req, res) => {
  try {
    // 获取当前登录用户的ID
    const userId = req.session.userAuth;

    // 根据用户ID查找收藏夹内容，并填充帖子数据
    const userSaver = await Saver.findOne({ user: userId }).populate({
      path: 'posts',
      select: 'title', // 只选择帖子的标题字段
    });

    if (!userSaver) {
      // 如果收藏夹不存在，创建一个新的空收藏夹
      const newSaver = new Saver({ user: userId, posts: [] });
      await newSaver.save();
      // 渲染视图并传递空的收藏夹数据
      return res.render("users/savers/viewSaver", { savers: [] });
    }

    // 确保 userSaver.posts 是一个数组
    if (!Array.isArray(userSaver.posts)) {
      userSaver.posts = [];
    }

    // 构建帖子链接
    const postsWithLinks = userSaver.posts.map(post => ({
      title: post.title,
      link: `/api/v1/posts/${post._id}`, // 根据你的路由设置调整链接格式
    }));

    // 渲染视图并传递收藏夹内容数据
    res.render("users/savers/viewSaver", { savers: postsWithLinks, error: "" });
  } catch (error) {
    // 如果出现错误，你可以选择渲染错误信息或执行其他操作
    res.render("error", { error: error.message });
  }
};

//upload cover image

const uploadCoverImgCtrl = async (req, res) => {
  try {
    //check if file exist
    if (!req.file) {
      return res.render("users/uploadProfilePhoto", {
        error: "Please upload image",
      });
    }
    //1. Find the user to be updated
    const userId = req.session.userAuth;
    const userFound = await User.findById(userId);
    //2. check if user is found
    if (!userFound) {
      return res.render("users/uploadProfilePhoto", {
        error: "User not found",
      });
    }
    //5.Update profile photo
    const userUpdated = await User.findByIdAndUpdate(
      userId,
      {
        coverImage: req.file.path,
      },
      {
        new: true,
      }
    );
    //redirect
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    return res.render("users/uploadProfilePhoto", {
      error: error.message,
    });
  }
};


const uploadAddressCtrl = async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    // Update user's address information
    const userId = req.session.userAuth;
    let address = `latitude: ${latitude}, longitude: ${longitude}`;
    const user = await User.findByIdAndUpdate(userId, { address }, { new: true });

    // Return success response
    res.status(200).json({ message: 'Address uploaded successfully', user });
  } catch (error) {
    // Handle error
    console.error('Error uploading address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// 更新用户简介
const updateBioCtrl = async (req, res) => {
  const { bio } = req.body;
  try {
    // 获取当前用户的 ID
    const userId = req.session.userAuth;
    
    // 更新用户的简介信息
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio },
      { new: true }
    );

    // 返回成功的响应
    res.status(200).json({ message: 'User bio updated successfully', user: updatedUser });
  } catch (error) {
    // 处理错误情况
    console.error('Error updating user bio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  registerCtrl,
  savePostToSaverCtrl,
  fetchSaverCtrl,
  deleteSaverCtrl,
  loginCtrl,
  userDetailsCtrl,
  profileCtrl,
  uploadProfilePhotoCtrl,
  uploadCoverImgCtrl,
  updatePasswordCtrl,
  updateUserCtrl,
  logoutCtrl,
  viewSaverCtrl,
  uploadAddressCtrl,
  updateBioCtrl,
};