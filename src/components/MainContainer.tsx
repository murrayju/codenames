import styled from 'styled-components';

interface Props {
  alignItems?: string;
  row?: boolean;
}

const MainContainer = styled.div<Props>`
  flex: 1 1;
  width: 100%;
  position: relative;
  overflow: auto;
  padding: 10px;
  display: flex;
  flex-flow: ${({ row }) => (row ? 'row' : 'column')} nowrap;
  align-items: ${({ alignItems }) => alignItems};

  > .container {
    padding: 0;
  }
`;

export default MainContainer;
