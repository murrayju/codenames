import React from 'react';
import { styled } from 'styled-components';

import type { GameState, Player } from '../api/Game.js';

import { WordTile } from './Tile.js';

const Board = styled.div`
  display: flex;
  flex-flow: row wrap;
  flex: 1 1 auto;
  width: 100%;
  max-width: 1750px;
  align-items: center;
  place-content: center;
  @media (max-width: ${({ theme }) => theme.screen.lgMin}),
    (max-height: ${({ theme }) => theme.screen.lgMinHt}) {
    max-width: 1300px;
  }
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    max-width: 800px;
  }
  @media (max-width: 401px), (max-height: 650px) {
    place-content: unset;
    justify-content: center;
  }

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
  gameState: GameState;
  images: string[];
  onTileSelected: (index: number) => void;
  player: Player;
};

const WordBoard = ({ gameState, images, onTileSelected, player }: Props) => {
  if (!gameState) {
    return null;
  }
  const { key, revealTileImages, revealed, words } = gameState;
  return (
    <div className="flex flex-auto overflow-auto">
      <Board>
        {words?.map((word, i) => (
          <WordTile
            key={word}
            image={revealTileImages?.[i] || null}
            onChoose={() => onTileSelected(i)}
            revealed={revealed?.[i] || false}
            role={player.role}
            type={key?.[i] || 'unknown'}
            word={word}
          />
        ))}
        <PreloadImages urls={images} />
      </Board>
    </div>
  );
};

export default WordBoard;
