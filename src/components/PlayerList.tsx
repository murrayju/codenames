import cn from 'classnames';
import React from 'react';

import type { Player } from '../api/Game.js';

import Icon from './Icon.js';

type Props = {
  className?: string;
  players: Player[];
};

export const PlayerList = ({ className = '', players }: Props) => {
  return (
    <div className={cn('flex flex-col', className)}>
      {players.map((player) => (
        <div
          className={cn(
            'px-4 py-1',
            { blue: 'text-blue-500', red: 'text-red-500' }[player.team],
          )}
        >
          <Icon
            className="mr-2"
            name={player.role === 'spymaster' ? 'user-secret' : 'user'}
            size={18}
          />
          {player.name}
        </div>
      ))}
    </div>
  );
};
