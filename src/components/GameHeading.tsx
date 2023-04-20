import cn from 'classnames';
import React, { FC, useContext, useEffect, useState } from 'react';

import type { GameDbData } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';

import { ConfirmModal } from './ConfirmModal.js';
import Icon, { Spinner } from './Icon.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip.js';

type Props = {
  className?: string;
  clientId: string;
  esConnected: boolean;
  game: GameDbData;
  id: string;
};

export const GameHeading: FC<Props> = ({
  className = '',
  clientId,
  esConnected,
  game,
  id,
}: Props) => {
  const { fetch } = useContext(AppContext);
  const [newRoundModalShown, setNewRoundModalShown] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const player = game?.players?.[clientId] || null;
  const isSpyMaster = player?.role === 'spymaster';
  const gameState = game.state;

  const newRound = () => {
    fetch(`/api/game/${id}/newRound`, {
      method: 'POST',
    }).catch((e) => console.error(e));
  };

  const rotateKey = () => {
    fetch(`/api/game/${id}/rotateKey`, {
      method: 'POST',
    }).catch((e) => console.error(e));
  };

  const exitToLobby = () => {
    fetch(`/api/game/${id}/lobby`, {
      body: JSON.stringify(player),
      method: 'POST',
    }).catch((e) => console.error(e));
  };

  const getSuggestion = () => {
    if (aiSuggestionLoading || aiSuggestion) {
      return;
    }
    setAiSuggestionLoading(true);
    fetch(`/api/game/${id}/suggestion`, {
      method: 'GET',
    })
      .then((r) => r.json())
      .then(({ message }) => {
        setAiSuggestion(message);
      })
      .catch((e) => console.error(e))
      .finally(() => setAiSuggestionLoading(false));
  };

  useEffect(() => {
    setAiSuggestion('');
  }, [gameState?.turn, gameState?.gameOver]);

  return gameState ? (
    <>
      <div
        className={cn(
          'flex flex-row items-center justify-center p-3',
          className,
        )}
      >
        {player?.location === 'table' ? (
          <>
            <div
              className="flex flex-auto items-center justify-start"
              style={{ flexBasis: '50%' }}
            >
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <div className="badge bg-spy-red text-white text-lg">
                    {gameState.remainingRed}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {`Red team has ${
                    gameState.remainingRed || 0
                  } tiles remaining out of ${gameState.totalRed || 0} total`}
                </TooltipContent>
              </Tooltip>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <div className="badge bg-spy-blue text-white text-lg ml-2">
                    {gameState.remainingBlue}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {`Blue team has ${
                    gameState.remainingBlue || 0
                  } tiles remaining out of ${gameState.totalBlue || 0} total`}
                </TooltipContent>
              </Tooltip>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <button className="ml-2" onClick={exitToLobby} type="button">
                    <Icon
                      className="fa-flip-horizontal"
                      name="right-to-bracket"
                      size={24}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Exit to lobby</TooltipContent>
              </Tooltip>
              <Tooltip placement="bottom">
                <TooltipTrigger asChild>
                  <button
                    className="ml-2"
                    onClick={() =>
                      gameState.gameStarted && !gameState.gameOver
                        ? setNewRoundModalShown(true)
                        : newRound()
                    }
                    type="button"
                  >
                    <Icon name="random" size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Shuffle the board and start a new round
                </TooltipContent>
              </Tooltip>
              {isSpyMaster ? (
                <Tooltip open={aiSuggestion ? true : undefined}>
                  <TooltipTrigger asChild>
                    <button
                      className="ml-2"
                      disabled={aiSuggestionLoading || !!aiSuggestion}
                      onClick={getSuggestion}
                      type="button"
                    >
                      {aiSuggestionLoading ? (
                        <Spinner name="robot" size={24} />
                      ) : (
                        <Icon name="robot" size={24} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {aiSuggestion || 'Get an AI suggestion for your clue'}
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {isSpyMaster && !gameState.gameStarted ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-2" onClick={rotateKey} type="button">
                      <Icon name="sync" size={24} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Rotate the spymaster key 90 degrees.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div className="flex items-center justify-center flex-none px-2">
              <h1
                className={cn(
                  'text-xl uppercase',
                  gameState.gameOver
                    ? 'text-spy-black'
                    : gameState.turn === 'red'
                    ? 'text-spy-red'
                    : 'text-spy-blue',
                )}
              >
                {gameState.gameOver
                  ? 'Game Over'
                  : `${gameState.turn} team's turn`}
              </h1>
            </div>
          </>
        ) : null}
        <div
          className="flex flex-auto flex-row flex-wrap items-center justify-end"
          style={{ flexBasis: '50%' }}
        >
          <Tooltip placement="bottom">
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  window.open(`https://meet.jit.si/codenames_${id}`, '_blank')
                }
                type="button"
              >
                <Icon name="video" size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Join video conference call using jitsi
            </TooltipContent>
          </Tooltip>
          <Tooltip placement="bottom">
            <TooltipTrigger asChild>
              <Icon
                className="p-2 ml-2"
                color={esConnected ? 'success' : 'danger'}
                name={esConnected ? 'wifi' : 'user-slash'}
              />
            </TooltipTrigger>
            <TooltipContent>
              Event stream{' '}
              {esConnected ? (
                'connected'
              ) : (
                <strong className="text-warning">disconnected</strong>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {newRoundModalShown && (
        <ConfirmModal
          message="The game is still in progress, do you really want to start a new round now?"
          onCancel={() => setNewRoundModalShown(false)}
          onConfirm={() => {
            newRound();
            setNewRoundModalShown(false);
          }}
          title="Are you sure?"
        />
      )}
    </>
  ) : null;
};
