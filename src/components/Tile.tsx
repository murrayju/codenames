import cn from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, useCallback } from 'react';
import { styled } from 'styled-components';

import type { Player, TileType } from '../api/Game.js';

import Icon, { IconName } from './Icon.js';
import { scTheme } from './Layout.js';

const portraitColors = {
  assassin: scTheme.game.spyBlack,
  blue: scTheme.game.spyBlue,
  bystander: scTheme.game.portraitBystander,
  red: scTheme.game.spyRed,
  unknown: scTheme.game.portraitUnknown,
};

const portraitIcons: Record<TileType, IconName> = {
  assassin: 'user-ninja',
  blue: 'user-secret',
  bystander: 'user',
  red: 'user-secret',
  unknown: 'user',
};

const borderColors = {
  assassin: scTheme.game.spyBlack,
  blue: scTheme.game.spyBlue,
  bystander: scTheme.game.cardDark,
  red: scTheme.game.spyRed,
  unknown: scTheme.game.cardDark,
};

interface TileProps {
  canChoose?: boolean;
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
  cursor: ${({ canChoose, onClick }) =>
    canChoose && onClick ? 'pointer' : 'arrow'};
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
    font-size: 5.5em;
    padding: 0;
    margin: 0;
  }
  @media (max-width: ${({ theme }) => theme.screen.lgMin}),
    (max-height: ${({ theme }) => theme.screen.lgMinHt}) {
    bottom: 4px;
    > i {
      font-size: 3.25em;
    }
  }
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    bottom: 3px;
    padding: 4px;
    > i {
      font-size: 1.6em;
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

const Word = styled.span.attrs(({ className }) => ({
  className: cn(className, 'uppercase'),
}))`
  font-weight: bold;
  margin-bottom: -5px;
`;

interface WordTileProps {
  canChoose: boolean;
  image?: null | string;
  onChoose: () => void;
  revealed: boolean;
  spymasterView?: boolean;
  type?: TileType;
  word: string;
}

export const WordTile: FC<WordTileProps> = ({
  canChoose,
  image = null,
  onChoose,
  revealed,
  spymasterView = false,
  type = 'unknown',
  word,
}) => {
  const shownType = spymasterView ? type : 'unknown';

  const handleChoose = useCallback(() => {
    if (canChoose && onChoose) {
      onChoose();
    }
  }, [canChoose, onChoose]);

  return (
    <div className="relative">
      <AnimatePresence initial={false}>
        <Tile canChoose={canChoose} onClick={handleChoose}>
          <InnerTile type={shownType}>
            <Top>
              <Icon css="color: #f7e6d6;" name="circle" />
              <Person type={shownType}>
                <Icon name={portraitIcons[shownType]} />
              </Person>
            </Top>
            <WordBox>
              <Word>{word}</Word>
            </WordBox>
          </InnerTile>
        </Tile>
        {revealed && image ? (
          <motion.div
            key={word}
            animate={{ opacity: 1, x: 0, y: 0 }}
            className="absolute top-0 left-0"
            initial={{ opacity: 0, x: -500, y: -300 }}
          >
            <Tile image={image} revealed type={type} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

interface AgentTileProps {
  className?: string;
  player: Player;
}

export const AgentTile: FC<AgentTileProps> = ({ className = '', player }) => {
  return (
    <Tile className={className}>
      <InnerTile type={player.team}>
        <Top>
          <Icon css="color: #f7e6d6;" name="circle" />
          <Person type={player.team}>
            <Icon name={player.role === 'spymaster' ? 'user-secret' : 'user'} />
          </Person>
        </Top>
        <WordBox>
          <Word className="truncate">{player.name}</Word>
        </WordBox>
      </InnerTile>
    </Tile>
  );
};
