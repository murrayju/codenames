import { FC } from 'react';
import { Outlet } from 'react-router-dom';

import Layout from '../components/Layout';

const RootRoute: FC = () => (
  <Layout>
    <Outlet />
  </Layout>
);

export default RootRoute;
