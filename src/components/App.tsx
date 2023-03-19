import React from 'react';
import type { ReactNode } from 'react';

import Layout from './Layout.js';

type Props = {
  children: ReactNode;
};
const App = ({ children }: Props) => <Layout container>{children}</Layout>;
export default App;
