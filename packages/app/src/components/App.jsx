import React from 'react';
import styled from 'styled-components';

import Menu from './menu/Menu.jsx';
import ViewerContainer from './viewer/ViewerContainer.jsx';

const DivStyled = styled.div`
  overflow: hidden;
  position: relative;
`;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this._viewer = null;
    this._onViewerChange = this._onViewerChange.bind(this);
  }

  _onViewerChange(changed) {
    if (changed.viewer !== undefined) {
      this._viewer = changed.viewer;
    }
    this.forceUpdate();
  }

  render() {
    return <DivStyled>
      <ViewerContainer onChange={ this._onViewerChange } />
      <Menu/>
    </DivStyled>;
  }
}
