import cn from 'classnames';
import React from 'react';

import type { Player, PlayerMap } from '../api/Game.js';

import { PlayerList } from './PlayerList.js';

type Props = {
  className?: string;
  players: PlayerMap;
};

export const SplitPlayers = ({ className = '', players }: Props) => {
  const { blue, red } = Object.values(players).reduce(
    (acc, player) => {
      if (player) {
        acc[player.team].push(player);
      }
      return acc;
    },
    { blue: [] as Player[], red: [] as Player[] },
  );
  return (
    <div className={cn('flex-auto flex flex-row', className)}>
      <PlayerList className="flex-auto w-[50%]" players={blue} />
      <PlayerList className="flex-auto w-[50%]" players={red} />
    </div>
  );
};
