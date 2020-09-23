const MINIMUM_PLAYER_COUNT = 4;
// const MAXIMUM_PLAYER_COUNT = 10;

// We'll update this once we build Player
type Player = any;

class Game {
  currentTurn: number;
  players: string[];
  stacks: { [key: number]: { type: "phrase" | "picture"; content: string } };
  constructor() {
    this.currentTurn = 0;
    this.players = [];
    this.stacks = [];
  }
  addPlayer = (playerId: string) => this.players.push(playerId);
  isReady = () => this.players.length >= MINIMUM_PLAYER_COUNT;
  nextTurn = () => this.currentTurn++;
  removePlayer = (playerId: string) =>
    (this.players = this.players.filter((id: string) => id !== playerId));
  resetGame = () => {
    this.currentTurn = 0;
  };
  getCurrentType = () => (this.currentTurn % 2 === 0 ? "phrase" : "picture");
}

module.exports = Game;
