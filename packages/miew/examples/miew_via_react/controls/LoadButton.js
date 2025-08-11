import React, { useContext } from 'react';
import MiewContext from '../MiewContext';

export default function LoadButton({ file }) {
  const viewer = useContext(MiewContext);

  const onChange = () => {
    viewer.load(file);
  };

  return <button disabled={!viewer} onClick={onChange}> {`Load ${file.toUpperCase()}.pdb`}</button>;
}
