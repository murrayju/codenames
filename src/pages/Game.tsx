import React, { FC } from 'react';
import { useParams } from 'react-router-dom';

import Game from '../components/Game';

interface Props {
  clientId: string;
}

const GameRoute: FC<Props> = ({ clientId }) => {
  const { id } = useParams();
  if (!id) {
    throw new Error('Missing game id');
  }
  return <Game clientId={clientId} id={id} />;
};

export default GameRoute;
