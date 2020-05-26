import React from 'react';

import Titlebar from './titlebar/Titlebar.jsx';

const style = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
};
// TODO add ErrorBoundaries https://reactjs.org/docs/error-boundaries.html

export default class Menu extends React.Component {
  render() {
    return <div id="miew-menu" style={ style }>
      <Titlebar/>
    </div>;
  }
}
