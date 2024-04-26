const Post = require("../../model/post/Post");
const User = require("../../model/user/User");
const appErr = require("../../utils/appErr");
const Saver = require("../../model/saver/Saver");
//create
// 创建帖子
// const createPostCtrl = async (req, res, next) => {
//   const { title, description, category, user } = req.body;
//   try {
//     if (!title || !description || !category || !req.file) {
//       return res.render("posts/addPost", { error: "All fields are required" });
//     }
//     // 获取当前登录用户的ID
//     const userId = req.session.userAuth;
//     // 生成链接（示例：将标题转换为链接）
//     const link = title.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
//     // 创建帖子
//     const postCreated = await Post.create({
//       title,
//       description,
//       category,
//       user: userId,
//       image: req.file.path,
//     });
//     // 更新用户的收藏夹
//     const userSaver = await Saver.findOne({ user: userId });
//     if (!userSaver) {
//       const newSaver = new Saver({ user: userId, posts: [] });
//       newSaver.posts.push(postCreated._id);
//       await newSaver.save();
//     } else {
//       userSaver.posts.push(postCreated._id);
//       await userSaver.save();
//     }
//     // 重定向到首页或其他页面
//     res.redirect("/");
//   } catch (error) {
//     return res.render("posts/addPost", { error: error.message });
//   }
// };

const createPostCtrl = async (req, res, next) => {
  const { title, description, category, user } = req.body;
  try {
    if (!title || !description || !category || !req.file) {
      return res.render("posts/addPost", { error: "All fields are required" });
    }
    // 获取当前登录用户的ID
    const userId = req.session.userAuth;
    // 生成链接（示例：将标题转换为链接）
    const link = title.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
    // 创建帖子
    const postCreated = await Post.create({
      title,
      description,
      category,
      user: userId,
      image: req.file.path,
    });
    // 重定向到首页或其他页面
    res.redirect("/");
  } catch (error) {
    return res.render("posts/addPost", { error: error.message });
  }
};


//all
const fetchPostsCtrl = async (req, res, next) => {
  try {
    const posts = await Post.find().populate("comments").populate("user");
    res.json({
      status: "success",
      data: posts,
    });
    console.log(posts);
  } catch (error) {
    next(appErr(error.message));
  }
};

//details
const fetchPostCtrl = async (req, res, next) => {
  try {
    //get the id from params
    const id = req.params.id;
    //find the post
    const post = await Post.findById(id)
      .populate({
        path: "comments",
        populate: {
          path: "user",
        },
      })
      .populate("user");
    res.render("posts/postDetails", {
      post,
      authorID: post.user._id, // 将作者的 ID 传递给模板
      error: "",
    });
  } catch (error) {
    next(appErr(error.message));
  }
};


//delete
const deletePostCtrl = async (req, res, next) => {
  try {
    //find the post
    const post = await Post.findById(req.params.id);
    //check if the post belongs to the user
    if (post.user.toString() !== req.session.userAuth.toString()) {
      return res.render("posts/postDetails", {
        error: "You are not authorized to delete this post",
        post,
      });
    }
    //delete post
    await Post.findByIdAndDelete(req.params.id);
    //redirect
    res.redirect("/");
  } catch (error) {
    return res.render("posts/postDetails", {
      error: error.message,
      post: "",
    });
  }
};

//update
const updatepostCtrl = async (req, res, next) => {
  const { title, description, category } = req.body;
  try {
    //find the post
    const post = await Post.findById(req.params.id);
    //check if the post belongs to the user
    if (post.user.toString() !== req.session.userAuth.toString()) {
      return res.render("posts/updatePost", {
        post: "",
        error: "You are not authorized to update this post",
      });
    }
    //check if user is updating image
    if (req.file) {
      await Post.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description,
          category,
          image: req.file.path,
        },
        {
          new: true,
        }
      );
    } else {
      //update
      await Post.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description,
          category,
        },
        {
          new: true,
        }
      );
    }

    //redirect
    res.redirect("/");
  } catch (error) {
    return res.render("posts/updatePost", {
      post: "",
      error: error.message,
    });
  }
};
module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  deletePostCtrl,
  updatepostCtrl,
};
