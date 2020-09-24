/*    3RD PARTY IMPORTS   */
const { v4: uuidv4 } = require("uuid");
import { Socket, Server } from "socket.io";

const MINIMUM_PLAYER_COUNT = 4;
// const MAXIMUM_PLAYER_COUNT = 10;

// We'll update this once we build Player
type Player = { name: string; socket: Socket };

class Game {
  currentTurn: number;
  players: { name: string; socket: Socket }[];
  stacks: {
    id: string;
    stack: { type: "phrase" | "picture"; content: string; playerId: string }[];
  }[];
  constructor() {
    this.currentTurn = 0;
    this.players = [];
    this.stacks = [];
  }
  allPlayersHaveSubmitted = () =>
    this.stacks.every((stack) => stack.stack.length >= this.currentTurn + 1);
  addPlayer = ({ name, socket }: Player) => this.players.push({ name, socket });
  isReady = () => this.players.length >= MINIMUM_PLAYER_COUNT;
  nextTurn = () => this.currentTurn++;
  removePlayer = (playerId: string) =>
    (this.players = this.players.filter(
      (player: Player) => player.socket.id !== playerId
    ));
  resetGame = () => {
    this.currentTurn = 0;
  };
  getCurrentType = () => (this.currentTurn % 2 === 0 ? "phrase" : "picture");
  beginRound = () => {};
  passStacks = () => {};
  addPhraseToStack = (
    playerId: string,
    data: { phrase: string; id?: string }
  ) => {
    console.log("adding to stack");
    if (this.stacks.length < this.players.length) {
      console.log("first stack");
      this.stacks.push({
        id: uuidv4(),
        stack: [{ type: "phrase", content: data.phrase, playerId }],
      });
    } else {
      const stackToAddTo = this.stacks.filter(
        (stack) => stack.id === data.id
      )[0];
      stackToAddTo.stack.push({
        type: "phrase",
        content: data.phrase,
        playerId,
      });
    }
  };
  roundIsFinished = () =>
    this.stacks.every((stack) => stack.stack.length >= this.players.length);
  setNextTurn = () => this.currentTurn++;
}

module.exports = Game;

// Stacks will have an id
