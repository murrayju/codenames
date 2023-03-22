import { darken } from 'polished';
import React, { FC } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import colors from 'tailwindcss/colors';

import '@fortawesome/fontawesome-free/css/all.min.css';

// external-global styles must be imported in your JS.
import Footer from './Footer.js';

// used by styled-components
export const scTheme = {
  brand: {
    black: colors.slate[900],
    danger: colors.red[600],
    info: colors.blue[400],
    primary: colors.blue[600],
    success: colors.green[600],
    warning: colors.amber[500],
    white: colors.slate[50],
  },
  game: {
    cardDark: '#b3a18b',
    cardLight: '#e7cfb5',
    portraitBackground: '#ddd1c1',
    portraitBorder: '#e9d9c9',
    portraitBystander: darken(0.2, '#ccbfb6'),
    portraitUnknown: '#ccbfb6',
    spyBlack: colors.zinc[900],
    spyBlue: colors.blue[800],
    spyRed: colors.red[800],
  },
  screen: {
    lgMin: '1695px',
    lgMinHt: '1000px',
    mdMax: '1694.98px',
    mdMin: '1170px',
    mdMinHt: '720px',
    smMax: '1169.98px',
    smMin: '768px',
    smMinHt: '420px',
    xsMax: '767.98px',
  },
};

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => (
  <ThemeProvider theme={scTheme}>
    <div className="fixed inset-0 bg-stone-200 flex flex-col overflow-auto">
      <div className="flex flex-col flex-auto items-center justify-center overflow-auto">
        {children}
      </div>
      <Footer />
    </div>
  </ThemeProvider>
);

export default Layout;
