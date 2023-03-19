import { GameDbData } from '../api/Game.js';

export interface GameEvents {
  stateChanged: {
    data: GameDbData;
  };
}
