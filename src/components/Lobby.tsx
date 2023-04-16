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
    <div className="flex flex-auto flex-col w-full p-4 overflow-y-auto">
      <JoinGameForm className="flex-none" clientId={clientId} game={game} />
      {game.players ? (
        <SplitPlayers
          className="flex-auto w-full mt-4 overflow-y-auto"
          players={game.players}
        />
      ) : null}
    </div>
  );
};
