import Miew from 'miew';
import PropTypes from 'prop-types';
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import styles from './Viewer.module.scss';
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
 * Deep comparison for options object to prevent unnecessary re-initializations
 * @param {Object} prev - Previous options
 * @param {Object} next - New options
 * @returns {boolean} True if options are equivalent
 */
function areOptionsEqual(prev, next) {
  try {
    return prev === next || JSON.stringify(prev) === JSON.stringify(next);
  } catch {
    return false;
  }
}

/**
 * React component wrapper for Miew 3D molecular viewer
 * @param {Object} props - Component props
 * @param {Function} props.onInit - Callback function called after successful Miew initialization
 * @param {Function} props.onError - Callback function called when an error occurs during initialization
 * @param {Object} props.options - Miew configuration options
 * @param {string} props.className - Additional CSS classes to apply to the root container
 * @param {Object} props.style - Inline styles to apply to the root container
 * @param {*} props.theme - Legacy prop kept for backwards compatibility, will be removed in future versions
 * @param {...Object} rest - Additional HTML attributes to spread on the root div element
 * @returns {JSX.Element} The Viewer component
 */
export default function Viewer({ onInit, onError, options, className, style, theme, ...rest }) {
  const miewRef = useRef();
  const rootRef = useRef();
  const onInitRef = useRef(onInit);
  const onErrorRef = useRef(onError);
  const optionsRef = useRef();

  // Keep callback refs updated
  useLayoutEffect(() => {
    onInitRef.current = onInit;
    onErrorRef.current = onError;
  });

  // Deprecation warning for theme prop
  useEffect(() => {
    if (theme !== undefined) {
      console.warn(
        'Warning: The "theme" prop is deprecated and will be removed in future versions of miew-react. It is kept for backwards compatibility only.',
      );
    }
  }, [theme]);

  // Memoize the complete options object to prevent re-initialization on equivalent options
  const stableOptions = useMemo(() => {
    const settings = { axes: false, fps: false, ...options?.settings };
    const newOptions = { ...options, settings };

    // Only return new object if options actually changed
    if (areOptionsEqual(optionsRef.current, newOptions)) {
      return optionsRef.current;
    }

    optionsRef.current = newOptions;
    return newOptions;
  }, [options]);

  // Initialize Miew instance only when options actually change
  useLayoutEffect(() => {
    createMiewRef(
      miewRef,
      { ...stableOptions, container: rootRef.current },
      onInitRef.current,
      onErrorRef.current,
    );
    return () => destroyMiewRef(miewRef);
  }, [stableOptions]);

  // Merge className with existing styles.root
  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={rootClassName} style={style} ref={rootRef} {...rest}>
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
  className: PropTypes.string, // Additional CSS classes
  style: PropTypes.object, // Inline styles object
  /** @deprecated This prop is deprecated and will be removed in future versions */
  theme: PropTypes.any,
};

Viewer.defaultProps = {
  onInit: undefined,
  onError: undefined,
  options: undefined,
  className: undefined,
  style: undefined,
  theme: undefined,
};
