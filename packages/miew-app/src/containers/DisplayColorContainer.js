import React from 'react';
import { useDispatch } from 'react-redux';

import DisplayPrefence from '../components/menu/displayPreference/DisplayPreference.jsx';
import { showDisplayColor } from '../actions';

const DisplayColorContainer = (props) => {
  const dispatch = useDispatch();

  return (
    <DisplayPrefence
      {...props}
      showDisplayPreference={() => dispatch(showDisplayColor())}
    />
  );
};

export default DisplayColorContainer;
