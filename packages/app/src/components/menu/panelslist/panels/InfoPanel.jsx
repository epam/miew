import React from 'react';

const InfoPanel = ({ complex }) => {
  const { name, metadata } = complex[0];
  const { classification, title, id } = metadata;
  return (
    <>
      <h1> {id || name || 'Unknown data'}
        <small> / {classification}</small>
      </h1>
      <p>{title.join(' ')}</p>
    </>);
};

InfoPanel.defaultProps = {
  id: 'none',
};

export default InfoPanel;
