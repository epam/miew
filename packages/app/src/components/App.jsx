import React from 'react';

import Menu from '../containers/MenuContainer';
import Viewer from '../containers/MiewViewerContainer';
import './App.scss';
// Need to fix this because the demo will be removed. We should not depend on anything there.
// eslint-disable-next-line import/no-relative-packages
import '../../../lib/demo/styles/main.scss';

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
      <Viewer onChange={ this._onViewerChange } />
        <Menu/>
    </div>;
  }
}
