import React from 'react';
import styled from 'styled-components';

import Titlebar from '../../containers/TitlebarContainer';
import PanelList from '../../containers/PanelListContainer';

const StyledMenu = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;

export default class Menu extends React.Component {
  render() {
    return <StyledMenu id="miew-menu">
      <Titlebar/>
      <PanelList/>
    </StyledMenu>;
  }
}
