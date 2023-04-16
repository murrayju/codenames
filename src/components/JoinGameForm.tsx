/* eslint-disable react/no-unknown-property */
import cn from 'classnames';
import { debounce } from 'lodash-es';
import React, {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styled from 'styled-components';

import type { GameDbData, Player, Role, Team } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';

import Icon from './Icon.js';

const Dossier = styled.div.attrs(({ className }) => ({
  className: cn(
    className,
    'py-8 px-16 rounded-2xl relative overflow-hidden font-mono w-full',
  ),
}))`
  background-color: ${({ theme }) => theme.game.cardLight};
  border: 3px solid rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  @media (max-width: ${({ theme }) => theme.screen.lgMin}),
    (max-height: ${({ theme }) => theme.screen.lgMinHt}) {
    font-size: 0.9rem;
  }
  @media (max-width: ${({ theme }) => theme.screen.mdMin}),
    (max-height: ${({ theme }) => theme.screen.mdMinHt}) {
    padding: 10px;
    font-size: 0.7rem;
  }
`;

const Heading = styled.span.attrs(({ className }) => ({
  className: cn(className, 'text-red-800'),
}))`
  font-weight: 800;
  font-size: 1.5em;
  margin-right: 0.5em;
`;

const Stamp = styled.span.attrs(({ className }) => ({
  className: cn(className, 'uppercase absolute'),
}))`
  font-size: 5em;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.15);
  z-index: 0;
  transform: rotate(-25deg);
  white-space: nowrap;
`;
const Stamp1 = styled(Stamp)`
  top: 34px;
  left: -20px;
`;
const Stamp2 = styled(Stamp)`
  bottom: 20px;
  right: -25px;
`;

type Props = {
  className?: string;
  clientId: string;
  game: GameDbData;
};

export const JoinGameForm = ({ className = '', clientId, game }: Props) => {
  const { fetch } = useContext(AppContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<Player>(
    () =>
      game.players?.[clientId] || {
        id: clientId,
        location: 'lobby',
        name: localStorage.getItem('agent_name') || '',
        role: 'operative',
        team: Math.random() > 0.5 ? 'red' : 'blue',
      },
  );

  const valid = !!playerInfo.name;

  const debouncedJoinLobby = useMemo(
    () =>
      debounce(
        (player: Player) => {
          fetch(`/api/game/${game.id}/lobby`, {
            body: JSON.stringify(player),
            method: 'POST',
          }).catch((e) => console.error(e));
        },
        200,
        { leading: false, trailing: true },
      ),
    [game.id],
  );

  useEffect(() => {
    if (clientId) {
      debouncedJoinLobby(playerInfo);
    }
  }, [clientId, playerInfo]);

  const handleJoinGame = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      if (!valid || isSubmitting) {
        return;
      }
      setSubmitting(true);
      evt.preventDefault();
      fetch(`/api/game/${game.id}/join`, {
        body: JSON.stringify(playerInfo),
        method: 'POST',
      })
        .catch((e) => console.error(e))
        .finally(() => setSubmitting(false));
    },
    [game.id, fetch, playerInfo],
  );

  const handleEditName = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('agent_name', evt.target.value);
    setPlayerInfo((p) => ({ ...p, name: evt.target.value }));
  }, []);

  return (
    <Dossier className={className}>
      <Stamp1>Top Secret</Stamp1>
      <Stamp2>Top Secret</Stamp2>
      <div className="relative z-10">
        <div className="flex items-center justify-center p-8">
          <h3 className="text-xl font-mono whitespace-nowrap">
            <Icon className="mr-2" name="search" />
            C0D3N4M3S
          </h3>
        </div>
        <div className="flex flex-wrap items-center text-[1.8em] mb-2">
          <Heading>OPERATION:</Heading>
          <span className="truncate uppercase">{game.id}</span>
        </div>
        <div className="flex flex-wrap flex-auto items-center text-[1.2em] mb-2">
          <Heading>AGENT:</Heading>
          <input
            className="flex-auto border-none rounded-md outline-none placeholder:italic px-3 drop-shadow-sm"
            onChange={handleEditName}
            placeholder="Name"
            type="text"
            value={playerInfo.name}
          />
        </div>
        <div className="flex flex-wrap flex-auto items-center text-md">
          <Heading>TEAM:</Heading>
          {['blue', 'red'].map((m) => (
            <label
              key={m}
              className={cn(
                'pr-2 uppercase font-bold',
                { blue: 'text-spy-blue', red: 'text-spy-red' }[m],
              )}
              htmlFor={m}
            >
              <input
                checked={playerInfo.team === m}
                className="mr-2"
                id={m}
                onChange={({ currentTarget: { value: team } }) => {
                  setPlayerInfo((p) => ({ ...p, team: team as Team }));
                }}
                type="radio"
                value={m}
              />
              {m}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center text-md">
          <Heading>DESIGNATION:</Heading>
          {['spymaster', 'operative'].map((m) => (
            <label key={m} className="pr-2 uppercase font-semibold" htmlFor={m}>
              <input
                checked={playerInfo.role === m}
                className="mr-2"
                id={m}
                onChange={({ currentTarget: { value: role } }) => {
                  setPlayerInfo((p) => ({ ...p, role: role as Role }));
                }}
                type="radio"
                value={m}
              />
              {m}
            </label>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            className={cn(
              'btn',
              playerInfo.role === 'spymaster'
                ? 'btn-black'
                : { blue: 'btn-blue', red: 'btn-red' }[playerInfo.team],
            )}
            disabled={!valid || isSubmitting}
            onClick={handleJoinGame}
            type="button"
          >
            <Icon
              className={cn(
                'pr-2',
                playerInfo.role === 'spymaster'
                  ? { blue: 'text-blue-500', red: 'text-red-500' }[
                      playerInfo.team
                    ]
                  : '',
              )}
              name={playerInfo.role === 'spymaster' ? 'user-secret' : 'user'}
              size={22}
            />
            Accept Mission
          </button>
        </div>
      </div>
    </Dossier>
  );
};
