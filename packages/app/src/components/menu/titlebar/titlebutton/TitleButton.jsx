import React from 'react';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Button from 'react-bootstrap/Button';

import styled from 'styled-components';

const StyledButton = styled(Button)`
  color: ${(props) => props.theme.titlebarColor};
  background-color: transparent;
  border: none; 
  border-radius: 0;
   
  &:hover,
  &.hover,
  &:focus,
  &.active,
  &.active:hover,
  &.active.hover,
  &.active:focus,
  &:active:focus:not(:disabled):not(.disabled){
    background-color: ${(props) => props.theme.titlebarBkg};
    outline: 0;
    border: none;
    box-shadow: none; 
  }
`;

export default class TitleButton extends React.Component {
  render() {
    return <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Tooltip id="button-tooltip" >
          {this.props.tip}
        </Tooltip>
      }
    >
      <StyledButton onClick={ (e) => {
        e.preventDefault();
        if (this.props.onClick) {
          this.props.onClick();
        }
      }}>{this.props.content}</StyledButton>
    </OverlayTrigger>;
  }
}
