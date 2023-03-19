import React, { FC } from 'react';
import { useParams } from 'react-router-dom';
import Game from '../components/Game';

const GameRoute: FC = () => {
  const { id } = useParams();
  if (!id) {
    throw new Error('Missing game id');
  }
  return <Game id={id} />;
};

export default GameRoute;
