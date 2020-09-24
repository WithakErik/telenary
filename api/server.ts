/*    3RD PARTY IMPORTS   */
const cors = require("cors");
require("dotenv").config();
const express = require("express");
const socketIo = require("socket.io");
const { v4: uuidv4 } = require("uuid");
import { Socket, Server } from "socket.io";

/*    INTERNAL IMPORTS    */
const Game = require("./Game");

/*    TYPES   */
interface Connections {
  [key: string]: {
    roomId: string | null;
    socket: SocketIO.Socket;
  };
}

/*    VARIABLES   */
const app = express();
app.use(cors({ origin: "http://localhost:5555" }));
const http = require("http").Server(app);
const { NODE_ENV } = process.env;
const connections: Connections | { [key: string]: any } = {};
const rooms: any = {};

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
// app.use("/", express.static("node_modules"));

const io = socketIo(http);

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
  socket.on("submit-phrase", (data) => handleSubmitPhrase(io, socket, data));
}

function handleCreateRoom(
  io: Server,
  socket: Socket,
  data: { name: string; roomId?: string | null }
) {
  const roomId = uuidv4().slice(0, 6);
  if (data.hasOwnProperty(roomId)) handleCreateRoom(io, socket, data);
  data.roomId = roomId;
  rooms[roomId] = { game: new Game() };
  handleJoinRoom(io, socket, data);
}
function handleDisconnect(socket: Socket) {
  console.log("Disconnecting");
  const { roomId } = connections[socket.id];
  if (!roomId || !rooms[roomId] || !rooms[roomId].game) return;
  const { game } = rooms[roomId];
  game.removePlayer(socket.id);
  delete connections[socket.id];
}
function handleJoinRoom(io: Server, socket: Socket, data: any) {
  const { name, roomId } = data;
  if (!rooms.hasOwnProperty(roomId)) return socket.emit("room-not-found");
  const { game } = rooms[roomId];
  socket.join(roomId);
  if (game.isReady()) {
    io.to(roomId).emit("game-is-ready");
  } else {
    socket.emit("waiting-for-more-players", { roomId });
    // Remove next when
    io.to(roomId).emit("game-is-ready", { roundStartType: "phrase" });
  }
  game.addPlayer({ name, socket });
  connections[socket.id].roomId = roomId;
  // socket.emit("sucessfully-joined-room", { roomId });
  // if (game.getPlayerCount() > 3) {
  //   const { name } = game.players[game.currentChooserSocketId];
  //   io.to(roomId).emit("waiting-for-player-to-start-game", { name });
  //   connections[game.currentChooserSocketId].socket.emit(
  //     "enable-start-game-button"
  //   );
  // }
  io.to(roomId).emit("update-players", { playerCount: game.players.length });
}
function handleStartGame(socket: Socket) {}
function handleSubmitPhrase(io: Server, socket: Socket, data: any) {
  const { roomId } = connections[socket.id];
  const { game } = rooms[roomId];
  game.addPhraseToStack(socket.id, data);
  if (game.allPlayersHaveSubmitted()) {
    // Also check for end of game
    if (game.roundIsFinished()) {
    } else {
      // We'll need to pass the stacks and emit the new `type` and `previousPhraseOrPicutre` to each player
    }
  } else {
    socket.emit("waiting-for-players-to-submit");
  }
  // Remove next line when going live
  socket.emit("waiting-for-players-to-submit");
  game.setNextTurn();
}
