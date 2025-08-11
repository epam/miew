import React, { useState, useEffect, useContext } from 'react';
import MiewContext from '../MiewContext';

export default function InfoPanel() {
  const viewer = useContext(MiewContext);
  const [autoRotation, setAutoRotation] = useState(0.0);

  useEffect(() => {
    if (!viewer) return () => {};

    const handleChange = () => {
      setAutoRotation(viewer.get('autoRotation'));
    };

    setAutoRotation(viewer.get('autoRotation'));
    viewer.settings.addEventListener('change:autoRotation', handleChange);

    return () => {
      viewer.settings.removeEventListener('change:autoRotation', handleChange);
    };
  }, [viewer]);

  return <a> {`Current speed: ${autoRotation.toFixed(1)}`} </a>;
}
