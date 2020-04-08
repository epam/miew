import React from 'react';
import ViewerContainer from './viewer/ViewerContainer.jsx';

export default class App extends React.Component {
  constructor() {
    super();
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
    return <div style = {{ width: '100%', height: '100%' }}>
      <ViewerContainer onChange={ this._onViewerChange } />
    </div>;
  }
}
