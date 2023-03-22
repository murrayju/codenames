import cn from 'classnames';
import React, { FC, useContext, useState } from 'react';
import { useCookies } from 'react-cookie';

import type { GameDbData } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';

import { ConfirmModal } from './ConfirmModal.js';
import Icon from './Icon.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip.js';

type Props = {
  className?: string;
  esConnected: boolean;
  game: GameDbData;
  id: string;
};

export const GameHeading: FC<Props> = ({
  className = '',
  esConnected,
  game,
  id,
}: Props) => {
  const { fetch } = useContext(AppContext);
  const [newRoundModalShown, setNewRoundModalShown] = useState(false);
  const [cookies] = useCookies();
  const { clientId } = cookies;
  const player = game?.players?.find((p) => p.id === clientId) || null;
  const isSpyMaster = player?.role === 'spymaster';
  const gameState = game.state;

  const pass = () => {
    fetch(`/api/game/${id}/pass`, {
      method: 'POST',
    }).catch((e) => console.error(e));
  };

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

  return gameState ? (
    <div className={cn('flex flex-row p-3', className)}>
      {player ? (
        <>
          <div className="flex flex-auto items-center justify-start">
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
            {isSpyMaster && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="ml-2"
                    disabled={gameState.gameStarted}
                    onClick={rotateKey}
                    type="button"
                  >
                    <Icon name="sync" size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Rotate the spymaster key 90 degrees.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center justify-center flex-auto text-xl">
            {gameState.gameOver ? (
              <h1 className="text-spy-black capitalize small-caps">
                Game Over
              </h1>
            ) : (
              <button
                className={cn(
                  'flex items-center justify-center',
                  gameState.turn === 'red' ? 'text-spy-red' : 'text-spy-blue',
                )}
                onClick={pass}
                type="button"
              >
                {gameState.turn} team&apos;s turn
                <Icon className="ml-4" name="step-forward" />
              </button>
            )}
          </div>
        </>
      ) : null}
      <div className="flex flex-auto flex-row flex-wrap items-center justify-end">
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
    </div>
  ) : null;
};
