import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import InfoPanel from '../../../containers/InfoPanelContainer';
import './PanelsList.scss';

export default class PanelsList extends React.Component {
  render() {
    return <div className="panels-list">
    <Tab.Container id="list-group-tabs-example" defaultActiveKey="#link1">
      <Row >
        <Col sm={4}>
          <ListGroup.Item action variant="light" href="#link1">Info</ListGroup.Item>
          <ListGroup.Item action disabled variant="light">Gallery</ListGroup.Item>
          <ListGroup.Item action variant="light" href="#link2">About</ListGroup.Item>
        </Col>
        <Col sm={8}>
          <Tab.Content>
            <Tab.Pane eventKey="#link1" >
              <InfoPanel/>
            </Tab.Pane>
            <Tab.Pane eventKey="#link2">
              <span style={{ color: 'silver' }}> About panel</span>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
    </div>;
  }
}

PanelsList.defaultProps = {
  visibility: 'hidden',
};
