import Miew from 'miew';
import React, { useLayoutEffect, useRef } from 'react';
import styles from './Viewer.module.scss';
import 'miew/dist/Miew.css';

function createMiewRef(miewRef, options, onInit) {
  if (!miewRef.current) {
    const miew = new Miew(options);
    if (miew.init()) {
      miewRef.current = miew;
      miew.run();

      if (typeof onInit === 'function') {
        onInit(miew);
      }
    }
  }
}

function destroyMiewRef(miewRef) {
  if (miewRef.current) {
    miewRef.current.term();
  }
  miewRef.current = null;
}

// eslint-disable-next-line react/prop-types
export default function Viewer({ onInit }) {
  const miewRef = useRef();
  const rootRef = useRef();

  useLayoutEffect(() => {
    const settings = { axes: false, fps: false };
    createMiewRef(miewRef, { container: rootRef.current, settings }, onInit);
    return () => destroyMiewRef(miewRef);
  }, [onInit]);

  return (
    <div className={styles.root} ref={rootRef}>
      Viewer
    </div>
  );
}
