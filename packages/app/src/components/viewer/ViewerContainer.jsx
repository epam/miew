import React from 'react';
import 'MiewStyles'; // eslint-disable-line import/no-unresolved

export default class ViewerContainer extends React.Component {
  render() {
    return <div className='miew-container' ref={this.domElement}/>;
  }
}

ViewerContainer.defaultProps = {
  frozen: false,
};
