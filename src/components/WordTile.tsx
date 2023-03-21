import React, { FC, useCallback } from 'react';
import styled from 'styled-components';

import type { Role, TileType } from '../api/Game.js';

import Icon, { IconName } from './Icon.js';
import { bsTheme } from './Layout.js';

const portraitColors = {
  assassin: bsTheme.game.spyBlack,
  blue: bsTheme.game.spyBlue,
  bystander: bsTheme.game.portraitBystander,
  red: bsTheme.game.spyRed,
  unknown: bsTheme.game.portraitUnknown,
};

const portraitIcons: Record<TileType, IconName> = {
  assassin: 'user-ninja',
  blue: 'user-secret',
  bystander: 'user',
  red: 'user-secret',
  unknown: 'user',
};

const borderColors = {
  assassin: bsTheme.game.spyBlack,
  blue: bsTheme.game.spyBlue,
  bystander: bsTheme.game.cardDark,
  red: bsTheme.game.spyRed,
  unknown: bsTheme.game.cardDark,
};

interface TileProps {
  image?: string;
  revealed?: boolean;
  type?: TileType;
}

const Tile = styled.div<TileProps>`
  background-color: ${({ revealed, theme, type }) =>
    revealed && type ? portraitColors[type] : theme.game.cardLight};
  ${({ image, revealed }) =>
    revealed && image
      ? `
    background-image: url('${image}');
    background-repeat: no-repeat;
    background-position: center center;
    background-origin: border-box;
    background-clip: border-box;
    background-size: cover;
    box-shadow: 5px 5px 5px #666;
  `
      : ''};
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin: 5px;
  padding: 10px;
  width: 325px;
  height: calc(325px * 4 / 7);
  font-size: 1em;
  @media (max-width: ${({ theme }) => theme.screen.lgMin}),
    (max-height: ${({ theme }) => theme.screen.lgMinHt}) {
    margin: 4px;
    padding: 5px;
    width: 220px;
    height: calc(220px * 4 / 7);
    font-size: 0.9em;
    ${({ image, revealed }) =>
      revealed && image ? 'box-shadow: 4px 4px 4px #666;' : ''};
  }
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    margin: 2px;
    padding: 3px;
    width: 130px;
    height: calc(130px * 4 / 7);
    font-size: 0.8em;
    ${({ image, revealed }) =>
      revealed && image ? 'box-shadow: 2px 2px 2px #666;' : ''};
  }
  @media (max-height: ${({ theme }) => theme.screen.smMinHt}) {
    height: calc(130px * 3 / 7);
  }
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'arrow')};
`;

interface InnerTileProps {
  type: TileType;
}

const InnerTile = styled.div<InnerTileProps>`
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: end;
  background-color: ${({ theme }) => theme.game.cardLight};
  border: 4px solid ${({ type }) => borderColors[type]};
  border-radius: 5px;
  height: 100%;
  padding: 5px;
  @media (max-width: ${({ theme }) => theme.screen.lgMin}),
    (max-height: ${({ theme }) => theme.screen.lgMinHt}) {
    padding: 4px;
    border-width: 3px;
  }
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    padding: 3px;
    border-width: 2px;
  }
  @media (max-height: ${({ theme }) => theme.screen.smMinHt}) {
    padding: 2px;
    border-width: 2px;
  }
`;

const Top = styled.div`
  display: flex;
  width: 100%;
  position: relative;
  flex-flow: column;
  align-items: center;
  flex: 1 1;

  > i {
    @media (max-width: ${({ theme }) => theme.screen.mdMin}),
      (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
      font-size: 0.7em;
    }
  }
`;

interface PersonProps {
  type: TileType;
}

const Person = styled.div<PersonProps>`
  display: flex;
  align-items: end;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 5px;
  padding: 5px;
  background-color: ${({ theme }) => theme.game.portraitBackground};
  border: 1px solid ${({ theme }) => theme.game.portraitBorder};

  > i {
    color: ${({ type }) => portraitColors[type]};
    font-size: 6.5em;
    padding: 0;
    margin: 0;
  }
  @media (max-width: ${({ theme }) => theme.screen.lgMin}),
    (max-height: ${({ theme }) => theme.screen.lgMinHt}) {
    bottom: 4px;
    > i {
      font-size: 4.25em;
    }
  }
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    bottom: 3px;
    padding: 4px;
    > i {
      font-size: 2.2em;
      margin-bottom: -2px;
    }
  }
  @media (max-height: ${({ theme }) => theme.screen.smMinHt}) {
    bottom: 2px;
    padding: 3px;
    > i {
      font-size: 1.5em;
      margin-bottom: -2px;
    }
  }
`;

const WordBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background-color: #dbe0fd;
  border: 2px solid #f3ebe9;
  border-radius: 4px;
  width: 100%;
  height: 2.5em;
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    height: 2em;
    border-width: 1px;
  }
  @media (max-height: ${({ theme }) => theme.screen.smMinHt}) {
    height: 1.5em;
  }
`;

const Word = styled.span`
  font-weight: bold;
  margin-bottom: -5px;
`;

interface Props {
  image?: null | string;
  onChoose: () => void;
  revealed: boolean;
  role: Role;
  type?: TileType;
  word: string;
}

const WordTile: FC<Props> = ({
  image = null,
  onChoose,
  revealed,
  role,
  type = 'unknown',
  word,
}) => {
  const isSpymaster = role === 'spymaster';
  const shownType = isSpymaster ? type : 'unknown';

  const handleChoose = useCallback(() => {
    if (!isSpymaster && onChoose) {
      onChoose();
    }
  }, [isSpymaster, onChoose]);

  return revealed && image ? (
    <Tile image={image} revealed type={type} />
  ) : (
    <Tile onClick={handleChoose}>
      <InnerTile type={shownType}>
        <Top>
          <Icon css="color: #f7e6d6;" name="circle" />
          <Person type={shownType}>
            <Icon name={portraitIcons[shownType]} />
          </Person>
        </Top>
        <WordBox>
          <Word>{word.toUpperCase()}</Word>
        </WordBox>
      </InnerTile>
    </Tile>
  );
};

export default WordTile;
