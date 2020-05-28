import React from 'react';

import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FiMenu, FiChevronRight } from 'react-icons/fi';
import { AiOutlinePicture } from 'react-icons/ai';
import { GiDrop } from 'react-icons/gi';

import TitleButton from './titlebutton/TitleButton.jsx';

const style = {
  display: 'flex',
  color: 'var(--titlebar-color)',
  // height: 'var(--titlebar-height)',
  justifyContent: 'space-between',
  backgroundColor: 'rgba(var(--titlebar-gray), var(--titlebar-gray), var(--titlebar-gray), var(--titlebar-alpha))',
};

export default class Titlebar extends React.Component {
  render() {
    return <ButtonToolbar style = { style }>
      <ButtonGroup>
        <TitleButton content={<FiMenu/>} tip="Menu"/>
        <TitleButton content={<FiChevronRight/>} tip="Terminal"></TitleButton>
      </ButtonGroup>

      <span data-field="title">3D Molecular Viewer</span>

      <ButtonGroup>
        <TitleButton content={<AiOutlinePicture/>} tip="Display mode"/>
        <TitleButton content={<GiDrop/>} tip="Display color"></TitleButton>
      </ButtonGroup>
   </ButtonToolbar>;
  }
}
