import React, { useState, useEffect, useContext } from 'react';
import MiewContext from '../MiewContext';

function getPrefFromViewer(viewer, prefName, prefType) {
  return (viewer && prefType(viewer.get(prefName))) || prefType();
}

export default function CheckBox({ prefName, prefType }) {
  const viewer = useContext(MiewContext);
  const [isChecked, setIsChecked] = useState(getPrefFromViewer(viewer, prefName, prefType));

  useEffect(() => {
    if (!viewer) return () => {};

    const handleCheckedChange = () => {
      setIsChecked(getPrefFromViewer(viewer, prefName, prefType));
    };

    setIsChecked(getPrefFromViewer(viewer, prefName, prefType));
    viewer.settings.addEventListener(`change:${prefName}`, handleCheckedChange);
    return () => {
      viewer.settings.removeEventListener(`change:${prefName}`, handleCheckedChange);
    };
  }, [viewer]);

  const handleCheck = () => {
    viewer.set(prefName, !isChecked);
  };

  return <input type='checkbox' disabled={!viewer} checked={ isChecked } onChange={ handleCheck } />;
}
