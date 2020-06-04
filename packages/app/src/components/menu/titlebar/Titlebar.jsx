import React from 'react';

import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import styled from 'styled-components';
import { FiMenu, FiChevronRight } from 'react-icons/fi';
import { AiOutlinePicture } from 'react-icons/ai';
import { GiDrop } from 'react-icons/gi';

import TitleButton from './titlebutton/TitleButton.jsx';
import ShowPanelsButton from '../../../containers/ShowPanelsButton.jsx';

const Toolbar = styled(ButtonToolbar)`
  color: ${(props) => props.theme.titlebarColor};
  height: ${(props) => props.theme.titlebarHeight};
  background-color: ${(props) => props.theme.titlebarBkg}; 
  justify-content: space-between;
`;

export default class Titlebar extends React.Component {
  render() {
    return <Toolbar>
      <ButtonGroup>
        <ShowPanelsButton content={<FiMenu/>} tip="Menu"/>
        <TitleButton content={<FiChevronRight/>} tip="Terminal"></TitleButton>
      </ButtonGroup>

      <span data-field="title">3D Molecular Viewer</span>

      <ButtonGroup>
        <TitleButton content={<AiOutlinePicture/>} tip="Display mode"/>
        <TitleButton content={<GiDrop/>} tip="Display color"></TitleButton>
      </ButtonGroup>
   </Toolbar>;
  }
}
