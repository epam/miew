import React from 'react';

import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import styled from 'styled-components';
import { FiMenu, FiChevronRight } from 'react-icons/fi';
import { AiOutlinePicture } from 'react-icons/ai';
import { GiDrop } from 'react-icons/gi';

import TitlebarButton from '../../../containers/TitlebarButtonContainer';
import {
  showDisplayColor, showDisplayMode, showTerminal, showNav,
} from '../../../actions';

const Toolbar = styled(ButtonToolbar)`
  color: ${(props) => props.theme.titlebarColor};
  height: ${(props) => props.theme.titlebarHeight};
  background-color: ${(props) => props.theme.titlebarBkg}; 
  justify-content: space-between;
  font-size: smaller; 
`;

// TODO move title to separate componen
// TODO solve the font for the whole app

const Titlebar = ({ loadingStage }) => <Toolbar>
    <ButtonGroup>
      <TitlebarButton content={<FiMenu/>} tip="Menu" dispatchFunction={showNav}/>
      <TitlebarButton content={<FiChevronRight/>} dispatchFunction={showTerminal} tip="Terminal"/>
    </ButtonGroup>

<span data-field="title" style={{ margin: '10px' }}>{loadingStage}</span>

    <ButtonGroup>
      <TitlebarButton dispatchFunction={showDisplayMode} content={<AiOutlinePicture/>} tip="Display mode"/>
      <TitlebarButton dispatchFunction={showDisplayColor} content={<GiDrop/>} tip="Display color"/>
    </ButtonGroup>
  </Toolbar>;

export default Titlebar;
