import React from 'react';
import { useDispatch } from 'react-redux';

import DisplayPreferences from '../components/menu/displayPreference/DisplayPreference.jsx';
import { showDisplayMode } from '../actions';

const DisplayModeContainer = (props) => {
  const dispatch = useDispatch();

  return (
    <DisplayPreferences
      {...props}
      showDisplayPreference={() => dispatch(showDisplayMode())}
    />
  );
};

export default DisplayModeContainer;
