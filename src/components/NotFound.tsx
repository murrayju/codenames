import React, { FC } from 'react';
import { Grid } from 'react-bootstrap';

interface Props {
  detail?: string;
  title?: string;
}

const NotFound: FC<Props> = ({ detail = '', title = 'Page Not Found' }) => (
  <Grid>
    <h1>{title}</h1>
    <p>Sorry, the page you were trying to view does not exist.</p>
    {detail ? <p>{detail}</p> : null}
  </Grid>
);

export default NotFound;
