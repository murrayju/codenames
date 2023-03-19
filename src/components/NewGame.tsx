import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import AppContext from '../contexts/AppContext.js';
import Loading from './Loading.js';
import NotFound from './NotFound.js';

const NewGame = () => {
  const { fetch } = useContext(AppContext);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/game`, {
      method: 'POST',
    })
      .then((r) => r.json())
      .then((game) => navigate(`/game/${game.id}`))
      .catch(() => setNotFound(true));
  }, [fetch]);
  return notFound ? <NotFound /> : <Loading what="new game" />;
};

export default NewGame;
