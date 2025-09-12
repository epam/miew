import Miew from 'miew';
import PropTypes from 'prop-types';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import * as styles from './Viewer.module.scss';
import 'miew/dist/Miew.css';

/**
 * Creates and initializes a Miew instance
 * @param {Object} miewRef - Ref to store the Miew instance
 * @param {Object} options - Miew initialization options
 * @param {Function} onInit - Callback function called after successful initialization
 * @param {Function} onError - Callback function called when an error occurs
 */
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
        const error = new Error('Failed to initialize Miew');
        if (typeof onError === 'function') {
          onError(error);
        }
      }
    } catch (error) {
      if (typeof onError === 'function') {
        onError(error);
      }
    }
  }
}

/**
 * Properly destroys a Miew instance and cleans up resources
 * @param {Object} miewRef - Ref containing the Miew instance
 */
function destroyMiewRef(miewRef) {
  if (miewRef.current) {
    miewRef.current.term();
  }
  miewRef.current = null;
}

/**
 * React component wrapper for Miew 3D molecular viewer
 * @param {Object} props - Component props
 * @param {Function} props.onInit - Callback function called after successful Miew initialization
 * @param {Function} props.onError - Callback function called when an error occurs during initialization
 * @param {Object} props.options - Miew configuration options
 * @param {*} props.theme - Legacy prop kept for backwards compatibility, will be removed in future versions
 * @returns {JSX.Element} The Viewer component
 */
export default function Viewer({ onInit, onError, options, theme }) {
  const miewRef = useRef();
  const rootRef = useRef();

  // Deprecation warning for theme prop
  useEffect(() => {
    if (theme !== undefined) {
      console.warn(
        'Warning: The "theme" prop is deprecated and will be removed in future versions of miew-react. It is kept for backwards compatibility only.',
      );
    }
  }, [theme]);

  useLayoutEffect(() => {
    const settings = { axes: false, fps: false, ...options?.settings };
    createMiewRef(miewRef, { ...options, container: rootRef.current, settings }, onInit, onError);
    return () => destroyMiewRef(miewRef);
  }, [onInit, onError, options]);

  return (
    <div className={styles.root} ref={rootRef}>
      Viewer
    </div>
  );
}

Viewer.propTypes = {
  onInit: PropTypes.func,
  onError: PropTypes.func,
  options: PropTypes.shape({
    load: PropTypes.string, // Molecule identifier or file path
    type: PropTypes.string, // File type (pdb, cif, etc.)
    settings: PropTypes.object, // Viewer settings (axes, fps, autoRotation, bg, etc.)
    settingsCookie: PropTypes.string, // Cookie name for storing settings
    cookiePath: PropTypes.string, // Cookie path
    reps: PropTypes.arrayOf(PropTypes.object), // Representations array
    container: PropTypes.instanceOf(typeof HTMLElement !== 'undefined' ? HTMLElement : Object), // DOM container element
  }),
  /** @deprecated This prop is deprecated and will be removed in future versions */
  theme: PropTypes.any,
};

Viewer.defaultProps = {
  onInit: undefined,
  onError: undefined,
  options: undefined,
  theme: undefined,
};
