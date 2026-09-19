const app = require("./src/app");
const connect = require("./src/db");
const { createServer } = require("http");

const httpServer = createServer(app);

const initSocketServer = require("./src/sockets/socket.server");

initSocketServer(httpServer);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connect();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`server is listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();