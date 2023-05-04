import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  detail?: string;
  title?: string;
}

const NotFound: FC<Props> = ({ detail = '', title = 'Page Not Found' }) => {
  const navigate = useNavigate();
  return (
    <div>
      <h1 className="text-2xl">{title}</h1>
      <p>Sorry, the page you were trying to view does not exist.</p>
      {detail ? <p>{detail}</p> : null}
      <button
        className="btn btn-blue mt-4"
        onClick={() => navigate('/')}
        type="button"
      >
        Start a new game
      </button>
    </div>
  );
};

export default NotFound;
