import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import CheckBox from './controls/Checkbox';
import SpeedButton from './controls/SpeedButton';
import InfoPanel from './controls/InfoPanel';
import LoadButton from './controls/LoadButton';
import ChangeRepOptButton from './controls/ChangeRepOptButton';
import Miew from '../../dist/Miew';
import MiewContext from './MiewContext';

const style = {
  width: '640px',
  height: '480px',
};

function App() {
  const domElementRef = useRef(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const miew = new Miew({ container: domElementRef.current, load: '1crn' });
    setViewer(miew);

    if (miew.init()) {
      miew.run();
    }
    return () => {
      miew.dispose();
    };
  }, []);

  return (
    <div>
      <div className='miew-container' ref={domElementRef} style={ style }/>
      <MiewContext.Provider value={viewer}>
        <div style={{ paddingTop: '0.5em' }}>
            <LoadButton file='1zlm' />&nbsp;
            <ChangeRepOptButton rep='0' mode='BS' />&nbsp;
            Axes = <CheckBox prefName='axes' prefType={Boolean} />&nbsp;
            Rotation = &nbsp;
            <SpeedButton prefName='autoRotation' delta={0.1} />&nbsp;
            <SpeedButton prefName='autoRotation' delta={-0.1} />&nbsp;
            <InfoPanel />
        </div>
      </MiewContext.Provider>
    </div>
  );
}

const container = document.getElementsByClassName('main')[0];
const root = createRoot(container);
root.render(<App />);
