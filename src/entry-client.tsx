import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import AppContext from './contexts/AppContext';
import createFetch from './util/createFetch';

declare global {
  interface Window {
    App: {
      apiUrl: string;
    };
  }
}

const customFetch = createFetch(fetch, {
  baseUrl: window.App.apiUrl,
});

ReactDOM.hydrateRoot(
  document.getElementById('app') as HTMLElement,
  <BrowserRouter>
    <AppContext.Provider value={{ fetch: customFetch }}>
      <App />
    </AppContext.Provider>
  </BrowserRouter>,
);
