import React, {
  useEffect, useMemo, useCallback, useState,
} from 'react';
import Viewer from 'miew-react';
import { MiewProvider } from '../../contexts/MiewContext';

export default function MiewViewer({
  frozen, onChange, updateLoadingStage, children,
}) {
  const [viewer, setViewer] = useState(null);

  const handlePrefsChange = useCallback((prefs) => {
    onChange({ prefs });
  }, [onChange]);

  const options = useMemo(() => ({
    load: '1crn',
    settings: {
      axes: false,
      fps: false,
    },
  }), []);

  const handleInit = useCallback((miew) => {
    window.miew = miew;
    miew.logger.level = 'debug';
    setViewer(miew);
    onChange({ viewer: miew });
  }, [onChange]);

  const handleError = useCallback(() => {
    updateLoadingStage('Failed to initialize viewer');
  }, [updateLoadingStage]);

  useEffect(() => {
    if (!viewer) {
      return undefined;
    }

    const handleFetching = () => updateLoadingStage('Fetching...');
    const handleParsing = () => updateLoadingStage('Parsing...');
    const handleRebuilding = () => updateLoadingStage('Building geometry...');
    const handleTitleChanged = (e) => updateLoadingStage(e.data);

    viewer.addEventListener('fetching', handleFetching);
    viewer.addEventListener('parsing', handleParsing);
    viewer.addEventListener('rebuilding', handleRebuilding);
    viewer.addEventListener('titleChanged', handleTitleChanged);
    viewer.settings.addEventListener('change:axes', handlePrefsChange);
    viewer.settings.addEventListener('change:autoRotation', handlePrefsChange);

    return () => {
      viewer.removeEventListener('fetching', handleFetching);
      viewer.removeEventListener('parsing', handleParsing);
      viewer.removeEventListener('rebuilding', handleRebuilding);
      viewer.removeEventListener('titleChanged', handleTitleChanged);
      viewer.settings.removeEventListener('change:axes', handlePrefsChange);
      viewer.settings.removeEventListener('change:autoRotation', handlePrefsChange);
    };
  }, [viewer, updateLoadingStage, handlePrefsChange]);

  useEffect(() => {
    if (!viewer) {
      return;
    }

    if (frozen) {
      viewer.halt();
    } else {
      viewer.run();
    }
  }, [frozen, viewer]);

  useEffect(() => () => {
    if (viewer) {
      if (window.miew === viewer) {
        window.miew = null;
      }
      onChange({ viewer: null });
    }
  }, [viewer, onChange]);

  return (
    <MiewProvider viewer={viewer}>
      <Viewer
        className="miew-container"
        options={options}
        onInit={handleInit}
        onError={handleError}
      />
      {children}
    </MiewProvider>
  );
}

MiewViewer.defaultProps = {
  frozen: false,
};
