import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MiewViewport from '../components/viewport/MiewViewport.jsx';
import {
  updateLoadingStage,
} from '../actions';

const MiewViewportContainer = (props) => {
  const dispatch = useDispatch();
  const frozen = useSelector((state) => state.visiblePanels?.visibility);

  return (
    <MiewViewport
      {...props}
      frozen={frozen}
      updateLoadingStage={(title) => dispatch(updateLoadingStage(title))}
    />
  );
};

export default MiewViewportContainer;
