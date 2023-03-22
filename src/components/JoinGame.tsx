/* eslint-disable react/no-unknown-property */
import cn from 'classnames';
import React, {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useCookies } from 'react-cookie';

import type { Player, Role, Team } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';

import Icon from './Icon.js';

type Props = {
  clientId: string;
  id: string;
};

const JoinGame = ({ clientId, id }: Props) => {
  const { fetch } = useContext(AppContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [cookies, setCookie] = useCookies();
  const [playerInfo, setPlayerInfo] = useState<Player>(() => ({
    id: clientId,
    name: cookies.codenames_name || '',
    role: 'operative',
    team: Math.random() > 0.5 ? 'red' : 'blue',
  }));

  const valid = !!playerInfo.name;

  const handleJoinGame = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      if (!valid || isSubmitting) {
        return;
      }
      setSubmitting(true);
      evt.preventDefault();
      fetch(`/api/game/${id}/join`, {
        body: JSON.stringify(playerInfo),
        method: 'POST',
      })
        .catch((e) => console.error(e))
        .finally(() => setSubmitting(false));
    },
    [fetch],
  );

  const handleEditName = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    setCookie('codenames_name', evt.target.value, { path: '/' });
    setPlayerInfo((p) => ({ ...p, name: evt.target.value }));
  }, []);

  return (
    <div className="flex flex-col flex-auto items-center justify-center">
      <div>
        <h1 className="text-2xl">Join Game: {id}</h1>
        <input
          className="my-2 border-none rounded-md outline-none placeholder:italic px-3 drop-shadow-sm"
          onChange={handleEditName}
          placeholder="Name"
          type="text"
          value={playerInfo.name}
        />
        <h2 className="text-lg mt-2">Team</h2>
        {['red', 'blue'].map((m) => (
          <label
            key={m}
            className={cn(
              'p-2',
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
        <h2 className="text-lg mt-2">Role</h2>
        {['spymaster', 'operative'].map((m) => (
          <label key={m} className="p-2" htmlFor={m}>
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
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
