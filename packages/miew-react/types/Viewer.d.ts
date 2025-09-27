import { Miew } from 'miew';

/**
 * Configuration options for the Miew 3D molecular viewer
 */
declare type ViewerOptions = {
  /** Molecule identifier or file path */
  load?: string;
  /** File type (pdb, cif, etc.) */
  type?: string;
  /** Viewer settings (axes, fps, autoRotation, bg, etc.) */
  settings?: { [key: string]: any };
  /** Cookie name for storing settings */
  settingsCookie?: string;
  /** Cookie path */
  cookiePath?: string;
  /** Representations array */
  reps?: Array<{ [key: string]: any }>;
  /** DOM container element */
  container?: HTMLElement;
};

/**
 * Props for the Miew React component
 */
declare type ViewerProps = {
  /** Callback function called after successful Miew initialization. Receives the Miew instance. */
  onInit?: (miew: Miew) => void;
  /** Callback function called when an error occurs during initialization. Receives the Error object. */
  onError?: (error: Error) => void;
  /** Configuration options for the Miew viewer */
  options?: ViewerOptions;
  /** Additional CSS classes to apply to the root container */
  className?: string;
  /** Inline styles to apply to the root container */
  style?: React.CSSProperties;
  /** @deprecated This prop is deprecated and will be removed in future versions */
  theme?: any;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Miew 3D Molecular Viewer React Component
 *
 * This React component wraps the core Miew library and provides an easy-to-use interface for
 * integrating 3D molecular visualization into React applications.
 *
 * @example
 * ```tsx
 * import React, { useCallback } from 'react';
 * import Viewer from 'miew-react';
 *
 * function App() {
 *   const handleInit = useCallback((miew) => {
 *     console.log('Miew initialized:', miew);
 *     // You can now use miew methods
 *   }, []);
 *
 *   const handleError = useCallback((error) => {
 *     console.error('Miew failed to initialize:', error);
 *     // Handle the error appropriately for your application
 *   }, []);
 *
 *   return (
 *     <Viewer
 *       options={{ load: '1CRN' }}
 *       onInit={handleInit}
 *       onError={handleError}
 *       className="custom-viewer"
 *       style={{ border: '1px solid #ccc', borderRadius: '8px' }}
 *       data-testid="molecular-viewer"
 *     />
 *   );
 * }
 * ```
 *
 * @param props - Component properties
 * @returns React component for 3D molecular visualization
 */
declare const Viewer: ({
  onInit,
  onError,
  options,
  className,
  style,
  theme,
  ...rest
}: ViewerProps) => JSX.Element;
export default Viewer;
