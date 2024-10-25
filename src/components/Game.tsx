import cn from 'classnames';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useCallback, useContext, useEffect, useState } from 'react';

import type { GameDbData, LogMessage } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';
import useEventSource from '../hooks/useEventSource.js';

import { AnimatedList } from './AnimatedList.js';
import { GameHeading } from './GameHeading.js';
import Icon from './Icon.js';
import Loading from './Loading.js';
import { Lobby } from './Lobby.js';
import NotFound from './NotFound.js';
import WordBoard from './WordBoard.js';

type Props = {
  clientId: string;
  id: string;
};

const Game: FC<Props> = ({ clientId, id }) => {
  const { fetch } = useContext(AppContext);
  const [game, setGame] = useState<null | GameDbData>(null);
  const [notFound, setNotFound] = useState(false);
  const player = game?.players?.[clientId] || null;
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    setGame(null);
    fetch(`/api/game/${id}`, {
      method: 'GET',
    })
      .then((r) => r.json())
      .then(setGame)
      .catch(() => {
        setGame(null);
        setNotFound(true);
      });
  }, [fetch, id]);

  useEffect(() => {
    fetch(`/api/game/${id}/logs`, {
      method: 'GET',
    })
      .then((r) => r.json())
      .then(setLogs)
      .catch((err) => {
        console.error('Failed to get logs', err);
      });
  }, [fetch]);

  useEffect(() => {
    fetch(`/api/game/${id}/images`, {
      method: 'GET',
    })
      .then((r) => r.json())
      .then(setImages)
      .catch((err) => {
        console.error('Failed to get images', err);
      });
  }, [fetch]);

  const handleEsInit = useCallback((es: EventSourcePolyfill) => {
    // @ts-expect-error ignore
    es.addEventListener('stateChanged', ({ data: rawData }) => {
      const data: GameDbData = JSON.parse(rawData);
      console.debug('stateChanged', data);
      setGame(data);
    });

    // @ts-expect-error ignore
    es.addEventListener('logMessage', ({ data: rawData }) => {
      const data: LogMessage = JSON.parse(rawData);
      console.debug('logMessage', data);
      setLogs((l) => l.concat(data));
    });
  }, []);

  const esConnected = useEventSource(
    `/api/game/${id}/events`,
    clientId,
    handleEsInit,
  );

  const gameState = game?.state;
  if (!gameState) {
    return notFound ? <NotFound /> : <Loading what="game data" />;
  }

  const selectTile = (index: number) => {
    fetch(`/api/game/${id}/selectTile/${index}`, {
      method: 'POST',
    }).catch((e) => console.error(e));
  };

  const pass = () => {
    fetch(`/api/game/${id}/pass`, {
      method: 'POST',
    }).catch((e) => console.error(e));
  };

  return clientId ? (
    <div className="flex flex-col flex-auto w-full overflow-hidden">
      <GameHeading
        className="flex-none"
        clientId={clientId}
        esConnected={esConnected}
        game={game}
        id={id}
      />
      <div className="flex flex-col flex-auto items-center justify-center overflow-hidden">
        {!player || player.location === 'lobby' ? (
          <Lobby clientId={clientId} game={game} />
        ) : (
          <WordBoard
            gameState={gameState}
            images={images}
            onTileSelected={selectTile}
            player={player}
          />
        )}
      </div>
      <div className="flex flex-col flex-none grow items-center justify-start h-[35px] relative">
        <AnimatePresence>
          {player?.role === 'operative' &&
          player.location === 'table' &&
          !gameState.gameOver &&
          gameState.turn === player.team ? (
            <motion.div
              key={player.team}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, y: 35 }}
              initial={{ opacity: 0, x: 0, y: -35 }}
              layout
              layoutId={player.team}
              transition={{ duration: 0.5 }}
            >
              <button
                className={cn(
                  'btn',
                  { blue: 'btn-blue', red: 'btn-red' }[player.team],
                )}
                onClick={pass}
                type="button"
              >
                Pass
                <Icon className="ml-4" name="step-forward" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="flex flex-col flex-none items-center justify-end mb-4 overflow-hidden">
        <AnimatedList
          className="flex flex-col items-center w-full max-h-16"
          messages={logs}
        />
      </div>
    </div>
  ) : (
    <Loading what="game" />
  );
};

export default Game;
