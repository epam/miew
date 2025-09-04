import Miew from 'miew';
import React, { useLayoutEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as styles from './Viewer.module.scss';
import 'miew/dist/Miew.css';

function createMiewRef(miewRef, options, onInit, onError) {
  if (!miewRef.current) {
    try {
      const miew = new Miew(options);
      if (miew.init()) {
        miewRef.current = miew;
        miew.run();

        if (typeof onInit === 'function') {
          onInit(miew);
        }
      } else {
        throw new Error('Failed to initialize Miew');
      }
    } catch (error) {
      console.error('Miew initialization failed:', error);
      if (typeof onError === 'function') {
        onError(error);
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
const Viewer = forwardRef(({ onInit, onError, options, className }, ref) => {
  const miewRef = useRef();
  const rootRef = useRef();
  const [isLoading, setIsLoading] = useState(true);

  useImperativeHandle(
    ref,
    () => ({
      getMiewInstance: () => miewRef.current,
      load: (data, options) => miewRef.current?.load(data, options),
      reset: () => miewRef.current?.reset(),
    }),
    [],
  );

  useLayoutEffect(() => {
    // eslint-disable-next-line react/prop-types
    const settings = { axes: false, fps: false, ...options?.settings };

    const handleInit = (miew) => {
      setIsLoading(false);
      if (typeof onInit === 'function') {
        onInit(miew);
      }
    };

    const handleError = (error) => {
      setIsLoading(false);
      if (typeof onError === 'function') {
        onError(error);
      }
    };

    createMiewRef(
      miewRef,
      { ...options, container: rootRef.current, settings },
      handleInit,
      handleError,
    );
    return () => destroyMiewRef(miewRef);
  }, [onInit, onError, options]);

  return (
    <div
      className={`${styles.root} ${className || ''}`}
      ref={rootRef}
      role="application"
      aria-label="3D Molecular Viewer"
      aria-busy={isLoading}
    >
      {isLoading && <div className={styles.loading}>Loading...</div>}
    </div>
  );
});

Viewer.displayName = 'Viewer';

Viewer.propTypes = {
  onInit: PropTypes.func,
  onError: PropTypes.func,
  options: PropTypes.shape({
    settings: PropTypes.object,
    container: PropTypes.object,
  }),
  className: PropTypes.string,
};

Viewer.defaultProps = {
  onInit: null,
  onError: null,
  options: {},
  className: '',
};

export default Viewer;
