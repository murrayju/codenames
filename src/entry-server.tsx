import React from 'react';
import { CookiesProvider } from 'react-cookie';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import { App } from './App';
import AppContext, { AppContextData } from './contexts/AppContext';

export interface RenderResult {
  appHtml: string;
  appCss: string;
}

export function render(url: string, context: AppContextData): RenderResult {
  const sheet = new ServerStyleSheet();
  const appHtml = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <StyleSheetManager sheet={sheet.instance}>
        <CookiesProvider cookies={context.cookies}>
          <AppContext.Provider value={context}>
            <App />
          </AppContext.Provider>
        </CookiesProvider>
      </StyleSheetManager>
    </StaticRouter>,
  );
  return {
    appHtml,
    appCss: sheet.getStyleTags(),
  };
}
