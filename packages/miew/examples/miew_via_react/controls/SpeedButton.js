import React, { useContext } from 'react';
import MiewContext from '../MiewContext';

const style = {
  width: '25px',
};

export default function SpeedButton({ prefName, delta }) {
  const viewer = useContext(MiewContext);

  const onChange = () => {
    const value = viewer.get(prefName) + delta;
    if (!Number.isNaN(value)) {
      viewer.set(prefName, value);
    }
  };

  return <button style = {style} disabled={!viewer} onClick={onChange}> {delta > 0 ? '+' : '-'} </button>;
}
