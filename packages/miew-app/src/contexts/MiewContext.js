import React, { createContext, useContext } from 'react';

// Context for sharing the Miew viewer instance across components
const MiewContext = createContext(null);

// Provider component to wrap the app and provide the viewer instance
export const MiewProvider = ({ children, viewer }) => (
  <MiewContext.Provider value={viewer}>
    {children}
  </MiewContext.Provider>
);

// Custom hook to use the Miew viewer instance
export const useMiew = () => {
  const viewer = useContext(MiewContext);
  return viewer;
};

export default MiewContext;
