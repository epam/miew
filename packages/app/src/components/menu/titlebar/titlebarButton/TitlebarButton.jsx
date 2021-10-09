import React from 'react';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Button from 'react-bootstrap/Button';

const TitlebarButton = ({
  onClick, dispatchFunction, content, tip,
}) => <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Tooltip id="button-tooltip" >
          {tip}
        </Tooltip>
      }
    >
      <Button className="titlebar-button" onClick={(e) => {
        e.preventDefault();
        if (onClick) {
          onClick(dispatchFunction);
        }
      }}>{content}</Button>
    </OverlayTrigger>;

export default TitlebarButton;
