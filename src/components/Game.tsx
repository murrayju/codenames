import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';

import type { GameDbData, LogMessage } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';
import useEventSource from '../hooks/useEventSource.js';

import { AnimatedList } from './AnimatedList.js';
import { GameHeading } from './GameHeading.js';
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

  const handleEsInit = useCallback((es: EventSourcePolyfill) => {
    // @ts-ignore
    es.addEventListener('stateChanged', ({ data: rawData }) => {
      const data: GameDbData = JSON.parse(rawData);
      console.debug('stateChanged', data);
      setGame(data);
    });

    // @ts-ignore
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
            onTileSelected={selectTile}
            player={player}
          />
        )}
      </div>
      <div className="flex flex-col flex-none grow items-center justify-center overflow-hidden">
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
