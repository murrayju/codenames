import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import ErrorPage from './components/ErrorPage';
import NotFound from './components/NotFound';
import Root from './pages/Root';
import Game from './pages/Game';
import NewGame from './pages/NewGame';

export const App: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Root />} errorElement={<ErrorPage />}>
        <Route index element={<NewGame />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};
