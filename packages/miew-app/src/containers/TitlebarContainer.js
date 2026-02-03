import React from 'react';
import { useSelector } from 'react-redux';

import Titlebar from '../components/menu/titlebar/Titlebar.jsx';

const TitlebarContainer = () => {
  const loadingStage = useSelector((state) => state.info?.loadingStage);
  const isPanelListVisible = useSelector((state) => state.visiblePanels?.isPanelListVisible);

  return (
    <Titlebar
      loadingStage={loadingStage}
      isPanelListVisible={isPanelListVisible}
    />
  );
};

export default TitlebarContainer;
