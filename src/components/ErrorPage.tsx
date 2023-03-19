import React, { FC } from 'react';
import { createGlobalStyle } from 'styled-components';
import { StatusError } from '../types/error.js';

const GlobalStyle = createGlobalStyle`
  html {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2rem;
    height: 100%;
    font-family: sans-serif;
    text-align: center;
    color: #888;
  }

  body {
    margin: 0;
  }

  h1 {
    font-weight: 400;
    color: #555;
  }

  pre {
    white-space: pre-wrap;
    text-align: left;
  }
`;

interface Props {
  error?: null | StatusError;
}

const ErrorPage: FC<Props> = ({ error = null }) => {
  if (__DEV__ && error) {
    return (
      <div>
        <GlobalStyle />
        <h1>{error.name}</h1>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  return (
    <div>
      <GlobalStyle />
      <h1>Error</h1>
      <p>Sorry, a critical error occurred on this page.</p>
    </div>
  );
};

export default ErrorPage;
