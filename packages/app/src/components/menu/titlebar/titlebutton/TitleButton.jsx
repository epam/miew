import React from 'react';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Button from 'react-bootstrap/Button';

import styled from 'styled-components';

const StyledButton = styled(Button)`
  color: silver;
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
