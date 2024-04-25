const express = require("express");
const multer = require("multer");
const storage = require("../../config/cloudinary");
const {
  createPostCtrl,
  deletePostCtrl,
  fetchPostCtrl,
  fetchPostsCtrl,
  updatepostCtrl,
} = require("../../controllers/posts/posts");
const postRoutes = express.Router();
const protected = require("../../middlewares/protected");

// Multer 实例
const upload = multer({
  storage,
});

// 帖子表单页面
postRoutes.get("/get-post-form", (req, res) => {
  res.render("posts/addPost", { error: "" });
});

// 帖子更新表单页面
postRoutes.get("/get-form-update/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.render("posts/updatePost", { post, error: "" });
  } catch (error) {
    res.render("posts/updatePost", { error, post: "" });
  }
});

// 创建帖子
postRoutes.post("/", protected, upload.single("file"), createPostCtrl);

// 获取所有帖子
postRoutes.get("/", fetchPostsCtrl);

// 获取单个帖子详情
postRoutes.get("/:id", fetchPostCtrl);

// 删除帖子
postRoutes.delete("/:id", protected, deletePostCtrl);

// 更新帖子
postRoutes.put("/:id", protected, upload.single("file"), updatepostCtrl);

module.exports = postRoutes;
