import React from 'react';

export default class InfoPanel extends React.Component {
  render() {
    return <div>
      <span style={{ color: 'red' }}>{this.props.id}</span>
    </div>;
  }
}

InfoPanel.defaultProps = {
  id: 'none',
};
