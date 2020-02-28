import React from 'react';
import ReactDOM from 'react-dom';
import ViewerContainer from './components/ViewerContainer';

class App extends React.Component {
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
    return <div>
      <ViewerContainer onChange={ this._onViewerChange } />
    </div>;
  }
}

const root = document.getElementsByClassName('main')[0];
ReactDOM.render(<App/>, root);
