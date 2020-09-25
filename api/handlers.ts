/*    3RD PARTY IMPORTS   */
import { Socket, Server } from "socket.io";
const { v4: uuidv4 } = require("uuid");

/*    INTERNAL IMPORTS    */
const Game = require("./Game");
import { Player } from "./Game";

/*    TYPES   */
interface Connections {
  [key: string]: {
    roomId: string | null;
    socket: SocketIO.Socket;
  };
}

/*    VARIABLES   */
const rooms: any = {};
export const connections: Connections | { [key: string]: any } = {};

/*    FUNCTIONS   */
export function handleCreateRoom(
  io: Server,
  socket: Socket,
  data: { name: string; roomId?: string | null }
) {
  const roomId = uuidv4().slice(0, 6);
  if (data.hasOwnProperty(roomId)) handleCreateRoom(io, socket, data);
  data.roomId = roomId;
  rooms[roomId] = { game: new Game() };
  return handleJoinRoom(io, socket, data);
}
export function handleDisconnect(socket: Socket) {
  console.log("Disconnecting");
  const { roomId } = connections[socket.id];
  if (!roomId || !rooms[roomId] || !rooms[roomId].game) return;
  const { game } = rooms[roomId];
  game.removePlayer(socket.id);
  return delete connections[socket.id];
}
export function handleJoinRoom(io: Server, socket: Socket, data: any) {
  const { name, roomId } = data;
  if (!rooms.hasOwnProperty(roomId)) return socket.emit("room-not-found");
  const { game } = rooms[roomId];
  if (
    game.players.filter(
      (player: Player) => player.name.toLowerCase() === name.toLowerCase()
    ).length
  )
    return socket.emit("duplicate-player-name");
  socket.join(roomId);
  if (game.gameIsReady()) {
    io.to(roomId).emit("game-is-ready");
  } else {
    socket.emit("waiting-for-more-players", { roomId });
    // Remove next when testing with multiple players
    io.to(roomId).emit("game-is-ready", { roundStartType: "phrase" });
  }
  game.addPlayer({ name, socket });
  connections[socket.id].roomId = roomId;
  return io
    .to(roomId)
    .emit("update-players", { playerCount: game.players.length });
}
export function handleStartGame(socket: Socket) {}
export function handleSubmitPhrase(io: Server, socket: Socket, data: any) {
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
    return socket.emit("waiting-for-players-to-submit");
  }
  // Remove next line when going live
  socket.emit("waiting-for-players-to-submit");
  return game.setNextTurn();
}
