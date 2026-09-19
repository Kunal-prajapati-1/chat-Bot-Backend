const { Server } = require("socket.io");
const {
  generateContent,
  generateEmbeddings,
} = require("../service/gemini.service");
const {
  upsertToPineCone,
  queryPineCone,
} = require("../service/pineCone.service");
const msgModel = require("../models/message.model");
const userModel = require("../models/user.model");
const chatModel = require("../models/chat.model");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

function inititateSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  // socket middleware

  io.use(async (socket, next) => {
    try {
      const { token } = cookie.parse(socket.handshake.headers?.cookie || "");

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;

      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);

      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("connected to server ", socket.user);

    //✅ listen for send_Msg
    socket.on("send_Msg", async (msgPayload) => {
      try {
        const { chatId, Query } = msgPayload;
        // Validation for chat_ID and Query
        if (!chatId || typeof Query !== "string" || !Query.trim()) {
          return socket.emit("chat_error", {
            message: "Invalid message",
          });
        }

        const query = Query.trim();

        if (query.length > 2000) {
          return socket.emit("chat_error", {
            message: "Message is too long",
          });
        }

        const chat = await chatModel.findOne({
          _id: chatId,
          user: socket.user._id,
        });

        if (!chat) {
          return socket.emit("chat_error", {
            message: "Chat not found",
          });
        }
        // console.log("query ", query, "chatId ", chatId);
        //✅ create msg
        const new_Msg = await msgModel.create({
          chat: chatId,
          user: socket.user._id,
          title: query,
          role: "user",
        });

        console.log("new msg ", new_Msg);

        //✅ convert query to embedding (vector)
        const Embedding = await generateEmbeddings(query);
        console.log("query embedding ", Embedding);
        console.log("msg id ", new_Msg._id);

        //✅ search query in pineCone vector database
        const queryResult = await queryPineCone({
          queryVector: Embedding,
          limit: 15,
          userId: socket.user._id,
        });

        //✅ upsert query embedding to pineCone
        const upsertRes = await upsertToPineCone({
          vectors: Embedding,
          msg_id: new_Msg._id,
          metadata: {
            chatId: chatId,
            userId: socket.user._id,
            text: query,
          },
        });

        const ltm = [
          {
            role: "user",
            parts: [
              {
                text: `these are some previous messages from the chats use this to generate response
          ${queryResult.matches.map((item) => item.metadata.text).join("\n")}`,
              },
            ],
          },
        ];

        // chat-History
        const historyDocs = (
          await msgModel
            .find({ chat: chatId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
        ).reverse();

        const stm = historyDocs.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.title }],
          };
        });

        console.log("longTermMemory ", ltm[0]);
        console.log("shortTermMemory ", stm);

        //✅ generate response
        const res = await generateContent([...ltm, ...stm]);
        console.log("response ", res);

        /* ------------- -------------- ------------- */
        //✅ sends res back to user socket
        socket.emit("send_Res", {
          chat_Id: chatId,
          res: res,
        });

        //✅ create Msg (AI_Model generated response_Msg)
        const Ai_Msg = await msgModel.create({
          chat: chatId,
          user: socket.user._id,
          title: res,
          role: "model",
        });

        //✅ generate vector of Ai_Msg
        const resVector = await generateEmbeddings(res);

        //✅ create memory of this response in Pine_cone
        const resMemory = await upsertToPineCone({
          vectors: resVector,
          msg_id: Ai_Msg._id,
          metadata: {
            chatId: chatId,
            userId: socket.user._id,
            text: res,
          },
        });
      } catch (err) {
        console.error("Message processing error:", err.message);

        socket.emit("chat_error", {
          message: "Something went wrong while processing your message.",
        });
      }
    });
  });
}

module.exports = inititateSocket;
