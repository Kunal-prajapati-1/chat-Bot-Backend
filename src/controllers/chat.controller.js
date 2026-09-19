const chatModel = require("../models/chat.model");
const msgModel = require("../models/message.model");

async function postChat(req, res) {
    try {
        const { title } = req.body;
        const user = req.user;

        if (!title || !title.trim()) {
            return res.status(422).json({
                msg: "chat title is required"
            });
        }

        const newChat = await chatModel.create({
            user: user._id,
            title: title.trim()
        });

        return res.status(201).json({
            msg: "new chat created successfully",
            newChat
        });

    } catch (err) {
        console.error("Create chat error:", err.message);

        return res.status(500).json({
            msg: "internal server error"
        });
    }
}


async function getChats(req, res) {
    try {
        const user = req.user;

        const chats = await chatModel.find({
            user: user._id
        });

        return res.status(200).json({
            message: "Chats retrieved successfully",
            chats: chats.map(chat => ({
                _id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity,
                user: chat.user
            }))
        });

    } catch (err) {
        console.error("Get chats error:", err.message);

        return res.status(500).json({
            msg: "internal server error"
        });
    }
}


async function getMsg(req, res) {
    try {
        const chatId = req.params.id;
        const user = req.user;

        // Verify that this chat belongs to the logged-in user
        const chat = await chatModel.findOne({
            _id: chatId,
            user: user._id
        });

        if (!chat) {
            return res.status(404).json({
                msg: "chat not found"
            });
        }

        const messages = await msgModel
            .find({
                chat: chatId,
                user: user._id
            })
            .sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Messages retrieved successfully",
            messages
        });

    } catch (err) {
        console.error("Get messages error:", err.message);

        return res.status(500).json({
            msg: "internal server error"
        });
    }
}


module.exports = {
    postChat,
    getChats,
    getMsg
};