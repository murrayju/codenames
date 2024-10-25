import cn from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';

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
      <AnimatePresence initial={false}>
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
            <motion.div
              key={player.id}
              animate={{
                opacity: player.location === 'lobby' ? 0.5 : 1,
                x: 0,
                y: 0,
              }}
              className="flex-none"
              exit={{ opacity: 0, x: '-500px' }}
              initial={{ opacity: 0, x: '-500px', y: `-300px` }}
              layout
              layoutId={player.id}
              transition={{ duration: 0.5 }}
            >
              <AgentTile key={player.id} player={player} />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};
