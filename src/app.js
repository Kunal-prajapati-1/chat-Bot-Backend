require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// ✅App
/* 
✅ express return a function
   function app (req, res){
     app.handler(req,res)
   } 
*/
const app = express();
// console.log('app : ',app)

app.use(cors({
  origin:process.env.FRONTEND_URL,
  credentials: true
}))


// ✅routes
const chatRoutes = require("./routes/chat.routes");
const authRoutes = require("./routes/auth.routes");

app.use(cookieParser()); // ✅ THIS LINE IS CRITICAL
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

module.exports = app;
