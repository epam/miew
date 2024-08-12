import React from 'react';

import Titlebar from '../../containers/TitlebarContainer';
import PanelList from '../../containers/PanelListContainer';
import DisplayColor from '../../containers/DisplayColorContainer';
import DisplayMode from '../../containers/DisplayModeContainer';
import Terminal from '../../containers/TerminalContainer';

const Menu = ({
  isPanelListVisible, isDisplayColorVisible, isDisplayModeVisible, isTerminalVisible,
}) => <div id="miew-menu">
      <Titlebar/>
      {isPanelListVisible && <PanelList/>}
      {isDisplayColorVisible && <DisplayColor preferenceName={'colorer'}/>}
      {isDisplayModeVisible && <DisplayMode preferenceName={'mode'}/>}
      {<Terminal isTerminalVisible={isTerminalVisible}/>}
    </div>;
export default Menu;
