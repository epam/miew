import React from 'react';
import styled from 'styled-components';

import Titlebar from './titlebar/Titlebar.jsx';
import PanelsList from './panelslist/PanelsList.jsx';

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
      <PanelsList/>
    </StyledMenu>;
  }
}
