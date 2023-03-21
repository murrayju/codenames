/* eslint-disable react/no-unknown-property */
import React, { FormEvent, useCallback, useContext, useState } from 'react';
import {
  Button,
  Col,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
} from 'react-bootstrap';
import { useCookies } from 'react-cookie';

import type { Player, Role, Team } from '../api/Game.js';
import AppContext from '../contexts/AppContext.js';

type Props = {
  clientId: string;
  id: string;
};

const Game = ({ clientId, id }: Props) => {
  const { fetch } = useContext(AppContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [cookies, setCookie] = useCookies();
  const [playerInfo, setPlayerInfo] = useState<Player>({
    id: clientId,
    name: cookies.codenames_name || '',
    role: 'operative',
    team: Math.random() > 0.5 ? 'red' : 'blue',
  });

  const valid = !!playerInfo.name;

  const submit = useCallback(
    (evt: FormEvent<Form>) => {
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

  return (
    <Form autoComplete="off" horizontal noValidate onSubmit={submit}>
      <h1>Join Game: {id}</h1>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={3}>
          Name
        </Col>
        <Col sm={9}>
          <FormControl
            disabled={isSubmitting}
            onChange={({
              // @ts-ignore
              currentTarget: { value: name },
            }: FormEvent<FormControl>) => {
              setCookie('codenames_name', name, { path: '/' });
              setPlayerInfo((p) => ({ ...p, name }));
            }}
            placeholder="Name"
            type="text"
            value={playerInfo.name}
          />
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={3}>
          Team
        </Col>
        <Col sm={9}>
          {['red', 'blue'].map((m) => (
            <label key={m} css="padding-left: 10px;" htmlFor={m}>
              <input
                checked={playerInfo.team === m}
                css="&& { margin-right: 5px; }"
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
        </Col>
      </FormGroup>
      <FormGroup>
        <Col componentClass={ControlLabel} sm={3}>
          Role
        </Col>
        <Col sm={9}>
          {['spymaster', 'operative'].map((m) => (
            <label key={m} css="padding-left: 10px;" htmlFor={m}>
              <input
                checked={playerInfo.role === m}
                css="&& { margin-right: 5px; }"
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
        </Col>
      </FormGroup>
      <FormGroup>
        <Col sm={9} smOffset={3}>
          <Button disabled={!valid || isSubmitting} type="submit">
            Join Game
          </Button>
        </Col>
      </FormGroup>
    </Form>
  );
};

export default Game;
