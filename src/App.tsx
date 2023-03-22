import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';

import ErrorPage from './components/ErrorPage';
import NotFound from './components/NotFound';
import Game from './pages/Game';
import NewGame from './pages/NewGame';
import Root from './pages/Root';
import './index.css';

export const App: FC = () => {
  return (
    <Routes>
      <Route element={<Root />} errorElement={<ErrorPage />} path="/">
        <Route element={<NewGame />} index />
        <Route element={<Game />} path="/game/:id" />
        <Route element={<NotFound />} path="/*" />
      </Route>
    </Routes>
  );
};
