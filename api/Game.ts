/*    3RD PARTY IMPORTS   */
const { v4: uuidv4 } = require("uuid");
import { Socket, Server } from "socket.io";

const MINIMUM_PLAYER_COUNT = 4;
// const MAXIMUM_PLAYER_COUNT = 10;

// We'll update this once we build Player
export type Player = {
  currentStackIndex: number;
  name: string;
  socket: Socket;
};
type Card = {
  content: string;
  playerName: string;
  type: "phrase" | "picture";
};
type Stack = {
  cards: Card[];
};

class Game {
  currentRound: number;
  players: Player[];
  stacks: Stack[];
  constructor() {
    this.currentRound = 0;
    this.players = [];
    this.stacks = [];
  }
  addCardToStack = (playerId: string, data: Card) => {
    const { type, content } = data;
    if (this.stacks.length < this.players.length) {
      this.stacks.push({
        cards: [
          { type, content, playerName: this.getPlayerFromId(playerId).name },
        ],
      });
      this.setPlayerCurrentStackIndex(playerId, this.stacks.length - 1);
    } else {
      this.stacks[this.getPlayerFromId(playerId).currentStackIndex].cards.push({
        type,
        content,
        playerName: this.getPlayerFromId(playerId).name,
      });
    }
  };
  addPlayer = ({ name, socket }: Player) =>
    this.players.push({ name, socket, currentStackIndex: 0 });
  allPlayersHaveSubmitted = () =>
    this.stacks.length === this.players.length &&
    this.stacks.every((stack) => stack.cards.length >= this.currentRound + 1);
  beginRound = () => {};
  getCurrentType = () => (this.currentRound % 2 === 0 ? "phrase" : "picture");
  getPlayerFromId = (playerId: string) =>
    this.players.filter((player) => player.socket.id === playerId)[0];
  getPlayerStack = (playerId: string) =>
    this.stacks[this.getPlayerFromId(playerId).currentStackIndex];
  gameIsReady = () => this.players.length >= MINIMUM_PLAYER_COUNT;
  passStacks = () => {};
  removePlayer = (playerId: string) =>
    (this.players = this.players.filter(
      (player: Player) => player.socket.id !== playerId
    ));
  resetGame = () => {
    this.currentRound = 0;
  };
  gameIsFinished = () =>
    this.stacks.every((stack) => stack.cards.length >= this.players.length);
  setPlayerCurrentStackIndex = (playerId: string, index: number) =>
    (this.getPlayerFromId(playerId).currentStackIndex = index);
  setNextTurn = () => {
    this.currentRound++;
    this.players = this.players.map((player) => {
      const nextStackIndex =
        (player.currentStackIndex + 1) % this.players.length;
      return {
        ...player,
        currentStackIndex: nextStackIndex,
      };
    });
  };
}

module.exports = Game;
