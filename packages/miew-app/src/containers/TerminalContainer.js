import React from 'react';
import { useSelector } from 'react-redux';

import Terminal from '../components/menu/terminal/Terminal.jsx';

const TerminalContainer = () => {
  const isTerminalVisible = useSelector(
    (state) => state.visiblePanels?.isTerminalVisible,
  );

  return <Terminal isTerminalVisible={isTerminalVisible} />;
};

export default TerminalContainer;
