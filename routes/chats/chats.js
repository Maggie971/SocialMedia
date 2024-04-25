const express = require("express");
const chatRoutes = express.Router();
const { createChat, getUserChats, getChatWindowsPage } = require("../../controllers/chats/chats");
const protected = require("../../middlewares/protected");
const storage = require("../../config/cloudinary");
const multer = require("multer"); 
const upload = multer({
    storage,
});

chatRoutes.get("/get-chat-form", (req, res) => {
  res.render("chats/createChatForm", { error: "" });
});

chatRoutes.post("/", protected, upload.single("image"), createChat);

chatRoutes.get("/user/:userId", protected, getUserChats);

chatRoutes.get("/chatWindows", getChatWindowsPage);

module.exports = chatRoutes;
