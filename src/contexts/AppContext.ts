import React from 'react';

import { CustomFetch } from '../util/createFetch.js';

export interface AppContextData {
  fetch: CustomFetch;
}

const AppContext = React.createContext<AppContextData>({
  fetch: async () => ({}) as Response,
});
export default AppContext;
