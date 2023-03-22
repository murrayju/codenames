import cn from 'classnames';
import React, { FC, useContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import styled from 'styled-components';

import type { GameDbData } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';

import { ConfirmModal } from './ConfirmModal.js';
import { FlowCenter, FlowLeft } from './flex.js';
import Icon from './Icon.js';
import IconButton from './IconButton.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip.js';

const Badge = styled.span`
  background-color: ${({ theme: { game } }) => game.spyBlack};
  color: ${({ theme: { game } }) => game.spyWhite};
  margin: 5px;
  padding: 10px;
  font-size: 2em;
  font-family: monospaced;
`;

const ColoredBadge = styled(Badge)`
  background-color: ${({
    color,
    theme: {
      game: { spyBlack, spyBlue, spyRed },
    },
  }) => (color === 'red' ? spyRed : color === 'blue' ? spyBlue : spyBlack)};
`;

const ColoredHeading = styled.h2`
  color: ${({
    color,
    theme: {
      game: { spyBlack, spyBlue, spyRed },
    },
  }) => (color === 'red' ? spyRed : color === 'blue' ? spyBlue : spyBlack)};
  font-variant: small-caps;
  text-transform: capitalize;
  cursor: ${({ onClick }) => onClick && 'pointer'};
`;

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
    <div className={cn('flex flex-row', className)}>
      {player ? (
        <>
          <FlowLeft>
            <Tooltip>
              <TooltipTrigger>
                <ColoredBadge color="red">
                  {gameState.remainingRed}
                </ColoredBadge>
              </TooltipTrigger>
              <TooltipContent>
                {`Red team has ${
                  gameState.remainingRed || 0
                } tiles remaining out of ${gameState.totalRed || 0} total`}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <ColoredBadge color="blue">
                  {gameState.remainingBlue}
                </ColoredBadge>
              </TooltipTrigger>
              <TooltipContent>
                {`Blue team has ${
                  gameState.remainingBlue || 0
                } tiles remaining out of ${gameState.totalBlue || 0} total`}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <IconButton
                  onClick={() =>
                    gameState.gameStarted && !gameState.gameOver
                      ? setNewRoundModalShown(true)
                      : newRound()
                  }
                >
                  <Icon name="random" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>
                Shuffle the board and start a new round
              </TooltipContent>
            </Tooltip>
            {isSpyMaster && (
              <Tooltip>
                <TooltipTrigger>
                  <IconButton
                    disabled={gameState.gameStarted}
                    onClick={rotateKey}
                  >
                    <Icon name="sync" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>
                  Rotate the spymaster key 90 degrees.
                </TooltipContent>
              </Tooltip>
            )}
          </FlowLeft>
          <FlowCenter>
            {gameState.gameOver ? (
              <ColoredHeading color="black">Game Over</ColoredHeading>
            ) : (
              <ColoredHeading color={gameState.turn} onClick={pass}>
                {gameState.turn} team&apos;s turn
                <Icon css="margin-left: 20px;" name="step-forward" />
              </ColoredHeading>
            )}
          </FlowCenter>
        </>
      ) : null}
      <div className="flex flex-auto flex-row flex-wrap items-center justify-end px-3 py-1">
        <Tooltip placement="bottom">
          <TooltipTrigger asChild>
            <IconButton
              iconSize={24}
              onClick={() =>
                window.open(`https://meet.jit.si/codenames_${id}`, '_blank')
              }
              smPad
            >
              <Icon name="video" />
            </IconButton>
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
