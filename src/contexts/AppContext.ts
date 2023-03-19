import React from 'react';
import { Cookies } from 'react-cookie';
import { CustomFetch } from '../util/createFetch.js';

export interface AppContextData {
  fetch: CustomFetch;
  cookies: Cookies;
}

const AppContext = React.createContext<AppContextData>({
  fetch: async () => {},
  cookies: new Cookies(),
});
export default AppContext;
