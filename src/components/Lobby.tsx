/* eslint-disable react/no-unknown-property */
import React from 'react';

import type { GameDbData } from '../api/Game.js';

import { JoinGameForm } from './JoinGameForm.js';
import { SplitPlayers } from './SplitPlayers.js';

type Props = {
  clientId: string;
  game: GameDbData;
};

export const Lobby = ({ clientId, game }: Props) => {
  return (
    <>
      <JoinGameForm clientId={clientId} game={game} />
      {game.lobby ? (
        <SplitPlayers
          className="w-full mt-4"
          players={game.lobby}
          title="Players in lobby:"
        />
      ) : null}
      {game.players ? (
        <SplitPlayers
          className="w-full mt-4"
          players={game.players}
          title="Players in game:"
        />
      ) : null}
    </>
  );
};
