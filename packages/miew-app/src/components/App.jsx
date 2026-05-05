import React from 'react';

import Menu from '../containers/MenuContainer';
import MiewViewport from '../containers/MiewViewportContainer';
import './App.scss';

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
    return <div className="root">
      <MiewViewport onChange={ this._onViewerChange }>
        <Menu/>
      </MiewViewport>
    </div>;
  }
}
