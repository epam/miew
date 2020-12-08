import React from 'react';

import Titlebar from '../../containers/TitlebarContainer';
import PanelList from '../../containers/PanelListContainer';
import DisplayColor from '../../containers/DisplayColorContainer';

const Menu = ({ isPanelListVisible, isDisplayColorVisible }) => <div id="miew-menu">
      <Titlebar/>
      {isPanelListVisible && <PanelList/>}
      {isDisplayColorVisible && <DisplayColor/>}
    </div>;
export default Menu;
