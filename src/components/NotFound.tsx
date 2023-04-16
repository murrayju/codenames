import React, { FC } from 'react';

interface Props {
  detail?: string;
  title?: string;
}

const NotFound: FC<Props> = ({ detail = '', title = 'Page Not Found' }) => (
  <div>
    <h1 className="text-2xl">{title}</h1>
    <p>Sorry, the page you were trying to view does not exist.</p>
    {detail ? <p>{detail}</p> : null}
  </div>
);

export default NotFound;
