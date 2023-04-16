import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

import { App } from './App';
import AppContext, { AppContextData } from './contexts/AppContext';

export interface RenderResult {
  appCss: string;
  appHtml: string;
}

export function render(url: string, context: AppContextData): RenderResult {
  const sheet = new ServerStyleSheet();
  const appHtml = ReactDOMServer.renderToString(
    <StaticRouter location={url}>
      <StyleSheetManager sheet={sheet.instance}>
        <AppContext.Provider value={context}>
          <App />
        </AppContext.Provider>
      </StyleSheetManager>
    </StaticRouter>,
  );
  return {
    appCss: sheet.getStyleTags(),
    appHtml,
  };
}
