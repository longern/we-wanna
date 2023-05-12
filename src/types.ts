export interface Player {
  x: number;
  y: number;
}

export interface Tile {
  x: number;
  y: number;
  disable_to?: number;
}

export interface Level {
  width: number;
  height: number;
  players: Player[];
  tiles: Tile[];
}
