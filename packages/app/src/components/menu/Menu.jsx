import React from 'react';

import Titlebar from '../../containers/TitlebarContainer';
import PanelList from '../../containers/PanelListContainer';
import DisplayColor from '../../containers/DisplayColorContainer';
import DisplayMode from '../../containers/DisplayModeContainer';

const Menu = ({ isPanelListVisible, isDisplayColorVisible, isDisplayModeVisible }) => <div id="miew-menu">
      <Titlebar/>
      {isPanelListVisible && <PanelList/>}
      {isDisplayColorVisible && <DisplayColor preferenceName={'colorer'}/>}
      {isDisplayModeVisible && <DisplayMode preferenceName={'mode'}/>}
    </div>;
export default Menu;
