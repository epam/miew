import React from 'react';
import { useDispatch } from 'react-redux';

import TitlebarButton from '../components/menu/titlebar/titlebarButton/TitlebarButton.jsx';

const TitlebarButtonContainer = (props) => {
  const dispatch = useDispatch();

  return (
    <TitlebarButton
      {...props}
      onClick={(dispatchFunction) => {
        if (dispatchFunction) {
          dispatch(dispatchFunction());
        }
      }}
    />
  );
};

export default TitlebarButtonContainer;
