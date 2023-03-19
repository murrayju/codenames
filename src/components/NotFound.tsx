import React, { FC } from 'react';
import { Grid } from 'react-bootstrap';

interface Props {
  title?: string;
  detail?: string;
}

const NotFound: FC<Props> = ({ title = 'Page Not Found', detail = '' }) => (
  <Grid>
    <h1>{title}</h1>
    <p>Sorry, the page you were trying to view does not exist.</p>
    {detail ? <p>{detail}</p> : null}
  </Grid>
);

export default NotFound;
