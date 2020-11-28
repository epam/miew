import React from 'react';
import styled from 'styled-components';

import Titlebar from '../../containers/TitlebarContainer';
import PanelList from '../../containers/PanelListContainer';
import DisplayColor from '../../containers/DisplayColorContainer';

const StyledMenu = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;

const Menu = ({ isPanelListVisible, isDisplayColorVisible }) => <StyledMenu id="miew-menu">
      <Titlebar/>
      {isPanelListVisible && <PanelList/>}
      {isDisplayColorVisible && <DisplayColor/>}
    </StyledMenu>;
export default Menu;
