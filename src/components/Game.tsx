import { EventSourcePolyfill } from 'event-source-polyfill';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

import type { GameDbData } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';
import useEventSource from '../hooks/useEventSource.js';

import { GameHeading } from './GameHeading.js';
import JoinGame from './JoinGame.js';
import Loading from './Loading.js';
import NotFound from './NotFound.js';
import WordBoard from './WordBoard.js';

type Props = {
  id: string;
};

const Game: FC<Props> = ({ id }) => {
  const { fetch } = useContext(AppContext);
  const [game, setGame] = useState<null | GameDbData>(null);
  const [notFound, setNotFound] = useState(false);
  const [cookies] = useCookies();
  const { clientId } = cookies;
  const player = game?.players?.find((p) => p.id === clientId) || null;

  const handleEsConnect = useCallback((es: EventSourcePolyfill) => {
    // @ts-ignore
    es.addEventListener('stateChanged', ({ data: rawData }) => {
      const data: GameDbData = JSON.parse(rawData);
      setGame(data);
    });
  }, []);

  const esConnected = useEventSource(`/api/game/${id}/events`, handleEsConnect);

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

  return (
    <div className="flex flex-col flex-auto w-full">
      <GameHeading
        className="flex-none"
        esConnected={esConnected}
        game={game}
        id={id}
      />
      {!player ? (
        <JoinGame clientId={clientId} id={id} />
      ) : (
        <WordBoard
          gameState={gameState}
          onTileSelected={selectTile}
          player={player}
        />
      )}
    </div>
  );
};

export default Game;
