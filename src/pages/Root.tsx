import React, { FC } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '../components/Layout';

const RootRoute: FC = () => (
  <Layout container>
    <Outlet />
  </Layout>
);

export default RootRoute;
