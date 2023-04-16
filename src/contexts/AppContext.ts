import React from 'react';

import { CustomFetch } from '../util/createFetch.js';

export interface AppContextData {
  fetch: CustomFetch;
}

const AppContext = React.createContext<AppContextData>({
  fetch: async () => {},
});
export default AppContext;
