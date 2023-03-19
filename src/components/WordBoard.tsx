import React from 'react';
import styled from 'styled-components';

import type { Player, GameState } from '../api/Game.js';
import WordTile from './WordTile.js';

const Board = styled.div`
  display: flex;
  flex-flow: row wrap;
  width: 100%;
  max-width: 1750px;
  @media (max-width: ${({ theme }) => theme.screen.lgMin}),
    (max-height: ${({ theme }) => theme.screen.lgMinHt}) {
    max-width: 1300px;
  }
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    max-width: 800px;
  }
  align-items: center;
  justify-content: center;

  > * {
    flex: 0 0 auto;
  }
`;

interface PreloadImagesProps {
  urls?: null | string[];
}

const PreloadImages = styled.div<PreloadImagesProps>`
  background: ${({ urls }) => urls?.map((url) => `url('${url}')`).join(', ')};
`;

type Props = {
  player: Player;
  gameState: GameState;
  onTileSelected: (index: number) => void;
};

const WordBoard = ({ player, gameState, onTileSelected }: Props) => {
  if (!gameState) {
    return null;
  }
  const { words, key, revealTileImages, revealed } = gameState;
  return (
    <Board>
      {words?.map((word, i) => (
        <WordTile
          key={word}
          word={word}
          role={player.role}
          type={key?.[i] || 'unknown'}
          image={revealTileImages?.[i] || null}
          revealed={revealed?.[i] || false}
          onChoose={() => onTileSelected(i)}
        />
      ))}
      <PreloadImages urls={revealTileImages} />
    </Board>
  );
};

export default WordBoard;
