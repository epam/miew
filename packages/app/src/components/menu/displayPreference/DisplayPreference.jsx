import React, { useEffect, useRef } from 'react';

import './DisplayPreference.scss';
import Thumbnail from './thumbnail/Thumbnail.jsx';

function DisplayPreferences({
  options,
  viewer,
  showDisplayPreference,
  preferenceName,
}) {
  const ref = useRef();
  const repr = viewer.rep(viewer.repCurrent());
  const instances = options.all.map((E) => new E());

  const Thumbnails = instances.map(({ shortName, id }, index) => (
    <Thumbnail
      shortName={shortName}
      id={id}
      key={index}
      selected={repr[preferenceName] === id}
      preferenceName={preferenceName}
      onClick={() => {
        viewer.rep({ [preferenceName]: id });
        showDisplayPreference();
      }}
    />
  ));

  const handleClickOutside = ({ target }) => {
    if (!ref.current.contains(target)) {
      showDisplayPreference();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="display-preference-container" ref={ref}>
      <div className="display-preference">
        <h5>Display {preferenceName}</h5>
        <div className="thumbnail-group">{Thumbnails}</div>
      </div>
    </div>
  );
}

export default DisplayPreferences;
