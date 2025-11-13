import React, { useEffect, useRef, useMemo } from 'react';

import Miew from 'MiewModule'; // eslint-disable-line import/no-unresolved

import './DisplayPreference.scss';
import Thumbnail from './thumbnail/Thumbnail.jsx';
import { useMiew } from '../../../contexts/MiewContext';

function DisplayPreferences({
  showDisplayPreference,
  preferenceName,
}) {
  const ref = useRef();
  const viewer = useMiew();

  // Memoize instances to avoid recreating them on every render
  const instances = useMemo(() => {
    const registry = preferenceName === 'mode' ? Miew.modes : Miew.colorers;
    return registry.all.map((E) => new E());
  }, [preferenceName]);

  if (!viewer) {
    return null;
  }

  const repr = viewer.rep(viewer.repCurrent());

  const Thumbnails = instances.map(({ shortName, id }, index) => (
    <Thumbnail
      shortName={shortName}
      id={id}
      key={index}
      selected={repr[preferenceName] === id}
      preferenceName={preferenceName}
      onClick={() => {
        if (viewer) {
          viewer.rep({ [preferenceName]: id });
          showDisplayPreference();
        }
      }}
    />
  ));

  const handleClickOutside = ({ target }) => {
    const pane = ref.current;
    if (!pane) {
      return;
    }

    const element = target instanceof Element ? target : target?.parentElement;
    if (!element) {
      return;
    }

    const trigger = element.closest('[data-preference-trigger]');
    if (trigger && trigger.getAttribute('data-preference-trigger') === preferenceName) {
      return;
    }

    if (!pane.contains(element)) {
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
