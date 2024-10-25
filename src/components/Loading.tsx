import { FC } from 'react';
import { styled } from 'styled-components';

import { Spinner } from './Icon.js';

const Box = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
`;

const LoadingText = styled.h4`
  && {
    display: inline;
    margin-left: 20px;
    vertical-align: middle;
    color: inherit;
  }
`;

interface Props {
  loading?: boolean;
  verb?: string;
  what?: string;
}

const Loading: FC<Props> = ({ loading = true, verb = 'Loading', what = '' }) =>
  loading ? (
    <Box>
      <Spinner size={32} />
      <LoadingText>
        {verb}
        {what ? ` ${what}` : ''}
        ...
      </LoadingText>
    </Box>
  ) : null;

export default Loading;
