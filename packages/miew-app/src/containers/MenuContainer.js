import React from 'react';
import { useSelector } from 'react-redux';

import Menu from '../components/menu/Menu.jsx';

const MenuContainer = () => {
  const isPanelListVisible = useSelector(
    (state) => state.visiblePanels?.isPanelListVisible,
  );
  const isDisplayColorVisible = useSelector(
    (state) => state.visiblePanels?.isDisplayColorVisible,
  );
  const isDisplayModeVisible = useSelector(
    (state) => state.visiblePanels?.isDisplayModeVisible,
  );
  const isTerminalVisible = useSelector(
    (state) => state.visiblePanels?.isTerminalVisible,
  );

  return (
    <Menu
      isPanelListVisible={isPanelListVisible}
      isDisplayColorVisible={isDisplayColorVisible}
      isDisplayModeVisible={isDisplayModeVisible}
      isTerminalVisible={isTerminalVisible}
    />
  );
};

export default MenuContainer;
