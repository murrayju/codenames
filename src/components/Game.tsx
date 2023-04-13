import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';

import type { GameDbData } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';
import useEventSource from '../hooks/useEventSource.js';

import { GameHeading } from './GameHeading.js';
import Loading from './Loading.js';
import { Lobby } from './Lobby.js';
import NotFound from './NotFound.js';
import WordBoard from './WordBoard.js';

type Props = {
  id: string;
};

const Game: FC<Props> = ({ id }) => {
  const { fetch } = useContext(AppContext);
  const [game, setGame] = useState<null | GameDbData>(null);
  const [notFound, setNotFound] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const player = (clientId && game?.players?.[clientId]) || null;

  useEffect(() => {
    fetch('/api/me', {
      method: 'GET',
    })
      .then((r) => r.json())
      .then((result) => setClientId(result.clientId))
      .catch((err) => {
        console.error('Failed to get clientId', err);
      });
  }, [fetch]);

  const handleEsInit = useCallback((es: EventSourcePolyfill) => {
    // @ts-ignore
    es.addEventListener('stateChanged', ({ data: rawData }) => {
      const data: GameDbData = JSON.parse(rawData);
      console.debug('stateChanged', data);
      setGame(data);
    });
  }, []);

  const esConnected = useEventSource(
    `/api/game/${id}/events`,
    clientId,
    handleEsInit,
  );

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
    </div>
  ) : (
    <Loading what="game" />
  );
};

export default Game;
