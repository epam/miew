import React from 'react';

const RenderSettingsPanel = () => {
  const options = [
    {
      name: 'Resolution',
    },
    {
      name: 'Resolution autodetection',
    },
    {
      name: 'Fog',
    },
    {
      name: 'Axes',
    },
    {
      name: 'FPS counter',
    },
    {
      name: 'FPS counter',
    },
    {
      name: 'Background color',
    },
  ];

  return (
    <>
      {options.map(({ name }, index) => (
        <li key={index} className="list-group-item">
          {name}
        </li>
      ))}
    </>
  );
};
export default RenderSettingsPanel;
