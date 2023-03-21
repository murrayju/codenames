import { darken, position } from 'polished';
import React, { FC } from 'react';
import type { ReactNode } from 'react';
import styled, { ThemeProvider } from 'styled-components';

import '@fortawesome/fontawesome-free/css/all.min.css';

// external-global styles must be imported in your JS.
import Footer from './Footer.js';
import MainContainer from './MainContainer.js';

// used by styled-components
// this should match the values in aura
export const bsTheme = {
  brand: {
    // DMA Red
    black: '#000',

    // DMA Orange
    danger: '#d9534f',

    // Used for text and other elements
    gray1: '#222',

    // Used for icons and secondary text
    gray2: '#333',

    // Used for watermarks and dark borders
    gray3: '#555',

    // Used for light borders
    gray4: '#777',

    // Used for off-white backgrounds
    gray5: '#eee',

    // DMA A green we use sometimes, subject to change.
    info: '#5bc0de',

    primary: '#337ab7',

    // DMA Light blue
    primaryDark: '#0962ac',

    // DMA Dark blue
    success: '#5cb85c',
    warning: '#f0ad4e', // Used for button gradients and almost white objects
    white: '#fff',
  },
  game: {
    cardDark: '#b3a18b',
    cardLight: '#e7cfb5',
    portraitBackground: '#ddd1c1',
    portraitBorder: '#e9d9c9',
    portraitBystander: darken(0.2, '#ccbfb6'),
    portraitUnknown: '#ccbfb6',
    spyBlack: '#32312e',
    spyBlue: '#003fff',
    spyRed: '#ed2024',
  },
  primaryGradient: {
    end: '#e2eaf0',
    mid: '#71a3cc',
    start: '#0962ac',
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

const PageRoot = styled.div`
  ${position('fixed', 0, 0, 0, 0)};
  width: 100%;
  overflow: auto;
  background-color: ${({ theme }) => theme.brand.gray5};
`;

const ContentRoot = styled.div`
  display: flex;
  width: 100%;
  flex: 1 1;
  flex-flow: column;
  align-items: center;
  overflow: auto;
`;

interface Props {
  alignItems?: string;
  children: ReactNode;
  container?: boolean;
  row?: boolean;
}

const Layout: FC<Props> = ({
  alignItems = 'center',
  children,
  container = false,
  row = false,
}) => (
  <ThemeProvider theme={bsTheme}>
    <PageRoot>
      <ContentRoot>
        {container ? (
          <MainContainer alignItems={alignItems} row={row}>
            {children}
          </MainContainer>
        ) : (
          children
        )}
      </ContentRoot>
      <Footer />
    </PageRoot>
  </ThemeProvider>
);

export default Layout;
