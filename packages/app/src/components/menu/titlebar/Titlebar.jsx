import React from 'react';

import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FiMenu, FiChevronRight } from 'react-icons/fi';
import { AiOutlinePicture } from 'react-icons/ai';
import { GiDrop } from 'react-icons/gi';

import TitlebarButton from '../../../containers/TitlebarButtonContainer';
import {
  showDisplayColor, showDisplayMode, showTerminal, showNav,
} from '../../../actions';
import './TitleBar.scss';

// TODO move title to separate componen
// TODO solve the font for the whole app

const Titlebar = ({ loadingStage }) => <ButtonToolbar className="titlebar">
    <ButtonGroup>
      <TitlebarButton content={<FiMenu/>} tip="Menu" dispatchFunction={showNav}/>
      <TitlebarButton content={<FiChevronRight/>} dispatchFunction={showTerminal} tip="Terminal"/>
    </ButtonGroup>

<span data-field="title" style={{ margin: '10px' }}>{loadingStage}</span>

    <ButtonGroup>
      <TitlebarButton dispatchFunction={showDisplayMode} content={<AiOutlinePicture/>} tip="Display mode"/>
      <TitlebarButton dispatchFunction={showDisplayColor} content={<GiDrop/>} tip="Display color"/>
    </ButtonGroup>
  </ButtonToolbar>;

export default Titlebar;
