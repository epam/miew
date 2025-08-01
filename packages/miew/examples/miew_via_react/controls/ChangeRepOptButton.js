import React, { useContext } from 'react';
import MiewContext from '../MiewContext';

export default function ChangeRepOptButton({ rep, mode }) {
  const viewer = useContext(MiewContext);

  const onChange = () => {
    viewer.rep(rep, { mode });
  };

  return <button disabled={!viewer} onClick={onChange}> {`Set rep ${rep} to ${mode}`}</button>;
}
