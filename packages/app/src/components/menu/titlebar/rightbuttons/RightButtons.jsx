import React from 'react';

import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';

export default class LeftButtons extends React.Component {
  render() {
    return <ButtonGroup>
      <Button>Menu open</Button>
      <Button>Terminal</Button>
    </ButtonGroup>;
  }
}