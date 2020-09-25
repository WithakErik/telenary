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
  playerId: string;
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
      this.stacks.push({ cards: [{ type, content, playerId }] });
    } else {
      this.stacks[this.getPlayerFromId(playerId).currentStackIndex].cards.push({
        type,
        content,
        playerId,
      });
    }
  };
  addPlayer = ({
    name,
    socket,
    currentStackIndex = this.players.length,
  }: Player) => this.players.push({ name, socket, currentStackIndex });
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
  nextTurn = () => this.currentRound++;
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
  setNextTurn = () => {
    this.currentRound++;
    this.players.map((player) => ({
      ...player,
      currentStackIndex: (player.currentStackIndex + 1) % this.players.length,
    }));
  };
}

module.exports = Game;

// Stacks will have an id
