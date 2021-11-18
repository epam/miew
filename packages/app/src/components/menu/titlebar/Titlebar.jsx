import React from 'react';

import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FiMenu, FiChevronRight } from 'react-icons/fi';
import { AiOutlinePicture } from 'react-icons/ai';
import { GiDrop } from 'react-icons/gi';

import TitlebarButton from '../../../containers/TitlebarButtonContainer';
import {
  showDisplayColor,
  showDisplayMode,
  showTerminal,
  showNav,
} from '../../../actions';

import './TitleBar.scss';

// TODO move title to separate componen
// TODO solve the font for the whole app

const Titlebar = ({ loadingStage, isPanelListVisible }) => {
  const menuButton = (
    <TitlebarButton
      content={<FiMenu />}
      tip="Menu"
      dispatchFunction={showNav}
    />
  );

  return isPanelListVisible ? (
    <ButtonToolbar className="titlebar titlebar-panels-list">{menuButton}</ButtonToolbar>
  ) : (
    <ButtonToolbar className="titlebar">
      <ButtonGroup>
        {menuButton}
        <TitlebarButton
          content={<FiChevronRight />}
          dispatchFunction={showTerminal}
          tip="Terminal"
        />
      </ButtonGroup>

      <span data-field="title" style={{ margin: '10px' }}>
        {loadingStage}
      </span>

      <ButtonGroup>
        <TitlebarButton
          dispatchFunction={showDisplayMode}
          content={<AiOutlinePicture />}
          tip="Display mode"
        />
        <TitlebarButton
          dispatchFunction={showDisplayColor}
          content={<GiDrop />}
          tip="Display color"
        />
      </ButtonGroup>
    </ButtonToolbar>
  );
};

export default Titlebar;
