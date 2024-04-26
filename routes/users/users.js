const express = require("express");
const multer = require("multer");
const storage = require("../../config/cloudinary");
const {
  registerCtrl,
  loginCtrl,
  userDetailsCtrl,
  profileCtrl,
  uploadProfilePhotoCtrl,
  uploadCoverImgCtrl,
  updatePasswordCtrl,
  updateUserCtrl,
  logoutCtrl,
  savePostToSaverCtrl,
  fetchSaverCtrl,
  deleteSaverCtrl,
  viewSaverCtrl,
  uploadAddressCtrl,
  updateBioCtrl,
} = require("../../controllers/users/users");
const protected = require("../../middlewares/protected");
const userRoutes = express.Router();

// Instance of multer
const upload = multer({ storage });

// Rendering forms
// login form
userRoutes.get("/login", (req, res) => {
  res.render("users/login", { error: "" });
});
// register form
userRoutes.get("/register", (req, res) => {
  res.render("users/register", {
    error: "",
  });
});

// upload profile photo
userRoutes.get("/upload-profile-photo-form", (req, res) => {
  res.render("users/uploadProfilePhoto", { error: "" });
});

// upload cover photo
userRoutes.get("/upload-cover-photo-form", (req, res) => {
  res.render("users/uploadCoverPhoto", { error: "" });
});

// update user form
userRoutes.get("/update-user-password", (req, res) => {
  res.render("users/updatePassword", { error: "" });
});

// POST /api/v1/users/register
userRoutes.post("/register", upload.single("profile"), registerCtrl);

// POST /api/v1/users/login
userRoutes.post("/login", loginCtrl);

// GET /api/v1/users/profile
userRoutes.get("/profile-page", protected, profileCtrl);

// PUT /api/v1/users/profile-photo-upload
userRoutes.put("/profile-photo-upload", protected, upload.single("profile"), uploadProfilePhotoCtrl);

// PUT /api/v1/users/cover-photo-upload
userRoutes.put("/cover-photo-upload", protected, upload.single("cover"), uploadCoverImgCtrl);

// PUT /api/v1/users/update-password
userRoutes.put("/update-password", protected, updatePasswordCtrl);

// PUT /api/v1/users/update
userRoutes.put("/update", protected, updateUserCtrl);

// GET /api/v1/users/logout
userRoutes.get("/logout", logoutCtrl);

// GET /api/v1/users/:id
userRoutes.get("/:id", userDetailsCtrl);

// POST /api/v1/users/savers
userRoutes.post("/savers", protected, savePostToSaverCtrl);

// GET /api/v1/users/savers
userRoutes.get("/savers", protected, fetchSaverCtrl);

// DELETE /api/v1/users/savers/:postId
userRoutes.delete("/savers/:postId", protected, deleteSaverCtrl);

// GET /api/v1/users/savers/view
userRoutes.get("/savers/view", protected, viewSaverCtrl);

// POST /api/v1/users/upload-address
userRoutes.post("/upload-address", protected, uploadAddressCtrl);

// POST /api/v1/users/update-bio
userRoutes.post("/update-bio", protected, updateBioCtrl);


module.exports = userRoutes;
