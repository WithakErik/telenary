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
export function handleSubmitCard(io: Server, socket: Socket, data: any) {
  const { roomId } = connections[socket.id];
  const { game } = rooms[roomId];
  game.addCardToStack(socket.id, data);
  if (game.allPlayersHaveSubmitted()) {
    if (game.gameIsFinished()) {
      game.deleteAllPlayers();
      return io.to(roomId).emit("game-has-finished", game.stacks);
    } else {
      game.setNextTurn(io);
      return game.players.map((player: Player) => {
        const playerCurrentStackIndex = game.getPlayerFromId(player.socket.id)
          .currentStackIndex;
        const playersCurrentStack =
          game.stacks[playerCurrentStackIndex].cards[game.currentRound - 1];
        player.socket.emit("begin-new-round", playersCurrentStack);
      });
    }
  }
  return socket.emit("waiting-for-players-to-submit");
}
