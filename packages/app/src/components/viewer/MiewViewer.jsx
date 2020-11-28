import React, { useEffect, useRef } from 'react';

import 'MiewStyles'; // eslint-disable-line import/no-unresolved

import Miew from 'MiewModule'; // eslint-disable-line import/no-unresolved

let viewer = null;
export default function MiewViewer({
  frozen, onChange, updateLoadingStage, sendInfo, saveColorers, saveViewer,
}) {
  const domElement = useRef();
  const _onChange = (prefs) => {
    onChange({ prefs });
  };

  function removeViewer() {
    // viewer.settings.now.removeEventListener(_onChange);
    viewer.term();
    viewer = null;
    onChange({ viewer });
  }

  useEffect(() => {
    viewer = window.miew = new Miew({ container: domElement.current, load: '1crn' });
    viewer.addEventListener('fetching', () => {
      updateLoadingStage('Fetching...');
    });
    viewer.addEventListener('parsing', () => {
      updateLoadingStage('Parsing…');
    });
    viewer.addEventListener('rebuilding', () => {
      updateLoadingStage('Building geometry…');
    });
    viewer.addEventListener('titleChanged', (e) => {
      updateLoadingStage(e.data);
    });
    const { colorers } = Miew;
    saveColorers(colorers);
    viewer.settings.addEventListener('change:axes', _onChange);
    viewer.settings.addEventListener('change:autoRotation', _onChange);
    onChange({ viewer });
    if (viewer.init()) {
      viewer.run();
    }
    viewer.addEventListener('buildingDone', () => {
      const names = viewer.getVisuals();
      const ids = [];
      for (let i = 0; i < names.length; i++) {
        const complex = viewer._getComplexVisual(names[i]).getComplex();
        ids.push(complex.name);
      }
      sendInfo(ids);
      saveViewer(viewer);
    });
    return removeViewer;
  }, []);

  useEffect(() => {
    if (frozen) {
      viewer.halt();
    } else {
      viewer.run();
    }
  }, [frozen]);

  return <div className='miew-container' ref={domElement}/>;
}

MiewViewer.defaultProps = {
  frozen: false,
};
