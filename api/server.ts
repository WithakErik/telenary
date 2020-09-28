/*    3RD PARTY IMPORTS   */
const cors = require("cors");
require("dotenv").config();
const express = require("express");
const socketIo = require("socket.io");
import { Socket } from "socket.io";
import { Request, Response } from "express";

/*    INTERNAL IMPORTS    */
import {
  connections,
  handleCreateRoom,
  handleDisconnect,
  handleJoinRoom,
  handleStartGame,
  handleSubmitCard,
} from "./handlers";

/*    VARIABLES   */
const app = express();
app.use(cors({ origin: "http://localhost:5555" }));
const http = require("http").Server(app);
const { NODE_ENV } = process.env;

/*    START SERVER    */
const server = http.listen(process.env.API_PORT || 5555, () => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`
PORT: ${process.env.API_PORT || 5555}

███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗     ██╗███╗   ██╗██╗████████╗██╗ █████╗ ████████╗███████╗██████╗ ██╗
██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗    ██║████╗  ██║██║╚══██╔══╝██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║
███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝    ██║██╔██╗ ██║██║   ██║   ██║███████║   ██║   █████╗  ██║  ██║██║
╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗    ██║██║╚██╗██║██║   ██║   ██║██╔══██║   ██║   ██╔══╝  ██║  ██║╚═╝
███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║    ██║██║ ╚████║██║   ██║   ██║██║  ██║   ██║   ███████╗██████╔╝██╗
╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝    ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝ ╚═╝
`);
  }
  process!.send!("ready");
});

app
  .route("/")
  .get((request: Request, response: Response) => response.sendStatus(418));

const io = socketIo(server);

/*    HANDLE SERVER SHUTDOWN    */
process.on("SIGTERM", async () => {
  console.log("\n\nSHUTTING DOWN SERVER!\n\n");
  process.exit();
});

io.on("connection", handleConnection);

function handleConnection(socket: Socket) {
  connections[socket.id] = { roomId: null, socket };
  console.log("Connected!", socket.id);
  socket.emit("success", "success");
  socket.on("create-room", (data: { name: string; roomId: null }) =>
    handleCreateRoom(io, socket, data)
  );
  socket.on("disconnect", () => handleDisconnect(socket));
  socket.on("join-room", (data) => handleJoinRoom(io, socket, data));
  socket.on("start-game", () => handleStartGame);
  socket.on("submit-card", (data) => handleSubmitCard(io, socket, data));
}
