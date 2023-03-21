import React from 'react';
import { Cookies, CookiesProvider } from 'react-cookie';
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

const cookies = new Cookies();
const customFetch = createFetch(fetch, {
  baseUrl: window.App.apiUrl,
});

ReactDOM.hydrateRoot(
  document.getElementById('app') as HTMLElement,
  <BrowserRouter>
    <CookiesProvider cookies={cookies}>
      <AppContext.Provider value={{ cookies, fetch: customFetch }}>
        <App />
      </AppContext.Provider>
    </CookiesProvider>
  </BrowserRouter>,
);
