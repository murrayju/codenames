import React from 'react';

import useVersion from '../hooks/useVersion.js';

import Icon from './Icon.js';

const Footer = () => {
  const [version] = useVersion();

  return (
    <div className="flex flex-row flex-none items-center justify-center p-1">
      <p
        className="flex-auto text-right items-end text-xs"
        style={{ flexBasis: '50%' }}
      >
        &copy; 2023 - Justin Murray
      </p>
      <h3 className="flex-none flex items-center justify-center text-sm font-mono mx-6">
        <Icon name="search" />
        <span>C0D3N4M3S</span>
      </h3>
      {version ? (
        <p
          className="flex-auto text-xs text-neutral-500"
          style={{ flexBasis: '50%' }}
        >
          v{version}
        </p>
      ) : null}
    </div>
  );
};

export default Footer;
