import React from 'react';
import styled, { ThemeProvider } from 'styled-components';

import theme from './theme';
import Menu from './menu/Menu.jsx';
import Viewer from '../containers/ControlViewer.jsx';

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
      <Viewer onChange={ this._onViewerChange } />
      <ThemeProvider theme={theme}>
        <Menu/>
      </ThemeProvider>
    </DivStyled>;
  }
}
