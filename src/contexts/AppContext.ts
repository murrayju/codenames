import React from 'react';
import { Cookies } from 'react-cookie';

import { CustomFetch } from '../util/createFetch.js';

export interface AppContextData {
  cookies: Cookies;
  fetch: CustomFetch;
}

const AppContext = React.createContext<AppContextData>({
  cookies: new Cookies(),
  fetch: async () => {},
});
export default AppContext;
