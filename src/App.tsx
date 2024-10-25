import { FC, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import ErrorPage from './components/ErrorPage';
import Loading from './components/Loading';
import NotFound from './components/NotFound';
import Game from './pages/Game';
import NewGame from './pages/NewGame';
import Root from './pages/Root';
import './index.css';

export const App: FC = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    fetch('/api/me', {
      method: 'GET',
    })
      .then((r) => r.json())
      .then((result) => setClientId(result.clientId))
      .catch((err) => {
        console.error('Failed to get clientId', err);
        setError(err);
      });
  }, [fetch]);
  return error ? (
    <ErrorPage error={error} />
  ) : clientId ? (
    <Routes>
      <Route element={<Root />} errorElement={<ErrorPage />} path="/">
        <Route element={<NewGame />} index />
        <Route element={<Game clientId={clientId} />} path="/game/:id" />
        <Route element={<NotFound />} path="/*" />
      </Route>
    </Routes>
  ) : (
    <Loading what="player info" />
  );
};
