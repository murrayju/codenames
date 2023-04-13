import cn from 'classnames';
import React from 'react';

import type { Player } from '../api/Game.js';

import { AgentTile } from './Tile.js';

type Props = {
  className?: string;
  players: Player[];
};

export const PlayerList = ({ className = '', players }: Props) => {
  return (
    <div
      className={cn(
        'flex flex-row flex-wrap items-center justify-center',
        className,
      )}
    >
      {players
        .sort((a, b) => {
          if (a.role !== b.role) {
            // role desc to put spymasters first
            return b.role.localeCompare(a.role);
          }
          if (a.location !== b.location) {
            // location desc to put table before lobby
            return b.location.localeCompare(a.location);
          }
          return a.name.localeCompare(b.name);
        })
        .map((player) => (
          <AgentTile
            key={player.id}
            className={cn('flex-none', {
              'opacity-50': player.location === 'lobby',
            })}
            player={player}
          />
        ))}
    </div>
  );
};
