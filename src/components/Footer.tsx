import React from 'react';

import useVersion from '../hooks/useVersion.js';

import Icon from './Icon.js';

const Footer = () => {
  const [version] = useVersion();

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <h3 className="text-md font-mono">
        <Icon name="search" />
        C0D3N4M3S
      </h3>
      <p className="text-sm">Copyright 2023 - Justin Murray</p>
      {version ? <p className="text-xs text-neutral-500">v{version}</p> : null}
    </div>
  );
};

export default Footer;
