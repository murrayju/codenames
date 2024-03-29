import { useContext, useEffect, useState } from 'react';

import AppContext from '../contexts/AppContext.js';

const useVersion = () => {
  const { fetch } = useContext(AppContext);
  const [version, setVersion] = useState('');

  useEffect(() => {
    fetch('/api/version', {
      method: 'GET',
    })
      .then((r) => r.json())
      .then(({ info: v }) => setVersion(v));
  }, [fetch]);

  return [version];
};

export default useVersion;
