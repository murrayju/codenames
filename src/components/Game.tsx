import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import styled from 'styled-components';
import { useCookies } from 'react-cookie';
import { OverlayTrigger, Popover, Badge } from 'react-bootstrap';

import { EventSourcePolyfill } from 'event-source-polyfill';
import useEventSource from '../hooks/useEventSource.js';
import AppContext from '../contexts/AppContext.js';
import WordBoard from './WordBoard.js';
import Icon from './Icon.js';
import IconButton from './IconButton.js';
import Loading from './Loading.js';
import NotFound from './NotFound.js';
import JoinGame from './JoinGame.js';
import ConfirmModal from './ConfirmModal.js';
import { Heading, FlowLeft, FlowCenter, FlowRight } from './flex.js';
import type { GameDbData } from '../api/Game.js';

const ColoredBadge = styled(Badge)`
  background-color: ${({
    theme: {
      game: { spyRed, spyBlue, spyBlack },
    },
    color,
  }) => (color === 'red' ? spyRed : color === 'blue' ? spyBlue : spyBlack)};
  margin: 5px;
  padding: 10px;
  font-size: 2em;
  font-family: monospaced;
`;

const ColoredHeading = styled.h2`
  color: ${({
    theme: {
      game: { spyRed, spyBlue, spyBlack },
    },
    color,
  }) => (color === 'red' ? spyRed : color === 'blue' ? spyBlue : spyBlack)};
  font-variant: small-caps;
  text-transform: capitalize;
  cursor: ${({ onClick }) => onClick && 'pointer'};
`;

type Props = {
  id: string;
};

const Game = ({ id }: Props) => {
  const { fetch } = useContext(AppContext);
  const [game, setGame] = useState<null | GameDbData>(null);
  const [notFound, setNotFound] = useState(false);
  const [newRoundModalShown, setNewRoundModalShown] = useState(false);
  const [cookies] = useCookies();
  const { clientId } = cookies;
  const player = game?.players?.find((p) => p.id === clientId) || null;
  const isSpyMaster = player?.role === 'spymaster';

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

  const handleEsConnect = useCallback((es: EventSourcePolyfill) => {
    // @ts-ignore
    es.addEventListener('stateChanged', ({ data: rawData }) => {
      const data: GameDbData = JSON.parse(rawData);
      setGame(data);
    });
  }, []);

  const esConnected = useEventSource(`/api/game/${id}/events`, handleEsConnect);

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

  const pop = (popId: string, content: ReactNode) => (
    <Popover id={popId}>{content}</Popover>
  );

  return (
    <>
      <Heading>
        {player ? (
          <>
            <FlowLeft>
              <OverlayTrigger
                overlay={pop(
                  'red-score',
                  `Red team has ${
                    gameState.remainingRed || 0
                  } tiles remaining out of ${gameState.totalRed || 0} total`,
                )}
                placement="bottom"
              >
                <ColoredBadge color="red">
                  {gameState.remainingRed}
                </ColoredBadge>
              </OverlayTrigger>
              <OverlayTrigger
                overlay={pop(
                  'blue-score',
                  `Blue team has ${
                    gameState.remainingBlue || 0
                  } tiles remaining out of ${gameState.totalBlue || 0} total`,
                )}
                placement="bottom"
              >
                <ColoredBadge color="blue">
                  {gameState.remainingBlue}
                </ColoredBadge>
              </OverlayTrigger>
              <OverlayTrigger
                overlay={pop(
                  'new-round',
                  'Shuffle the board and start a new round',
                )}
                placement="bottom"
              >
                <IconButton
                  onClick={() =>
                    gameState.gameStarted && !gameState.gameOver
                      ? setNewRoundModalShown(true)
                      : newRound()
                  }
                >
                  <Icon name="random" />
                </IconButton>
              </OverlayTrigger>{' '}
              {isSpyMaster && (
                <OverlayTrigger
                  overlay={pop(
                    'rotate-key',
                    'Rotate the spymaster key 90 degrees.',
                  )}
                  placement="bottom"
                >
                  <IconButton
                    onClick={rotateKey}
                    disabled={gameState.gameStarted}
                  >
                    <Icon name="sync" />
                  </IconButton>
                </OverlayTrigger>
              )}
            </FlowLeft>
            <FlowCenter>
              {gameState.gameOver ? (
                <ColoredHeading color="black">Game Over</ColoredHeading>
              ) : (
                <ColoredHeading onClick={pass} color={gameState.turn}>
                  {gameState.turn} team&apos;s turn
                  <Icon name="step-forward" css="margin-left: 20px;" />
                </ColoredHeading>
              )}
            </FlowCenter>
          </>
        ) : null}
        <FlowRight>
          <OverlayTrigger
            overlay={pop(
              'join-video',
              'Join video conference call using jitsi',
            )}
            placement="bottom"
          >
            <IconButton
              onClick={() =>
                window.open(`https://meet.jit.si/codenames_${id}`, '_blank')
              }
            >
              <Icon name="video" />
            </IconButton>
          </OverlayTrigger>{' '}
          <OverlayTrigger
            overlay={pop(
              'event-stream',
              <>
                Event stream{' '}
                {esConnected ? (
                  'connected'
                ) : (
                  <strong className="text-warning">disconnected</strong>
                )}
              </>,
            )}
            placement="bottom"
          >
            <Icon
              css=" && { margin-right: 20px; margin-left: 0; }"
              name={esConnected ? 'wifi' : 'user-slash'}
              color={esConnected ? 'success' : 'danger'}
            />
          </OverlayTrigger>
        </FlowRight>
      </Heading>
      {!player ? (
        <JoinGame id={id} clientId={clientId} />
      ) : (
        <WordBoard
          player={player}
          gameState={gameState}
          onTileSelected={selectTile}
        />
      )}
      {newRoundModalShown && (
        <ConfirmModal
          title="Are you sure?"
          message="The game is still in progress, do you really want to start a new round now?"
          onCancel={() => setNewRoundModalShown(false)}
          onConfirm={() => {
            newRound();
            setNewRoundModalShown(false);
          }}
        />
      )}
    </>
  );
};

export default Game;
