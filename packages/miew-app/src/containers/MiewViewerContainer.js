import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MiewViewer from '../components/viewer/MiewViewer.jsx';
import {
  updateLoadingStage,
} from '../actions';

const MiewViewerContainer = (props) => {
  const dispatch = useDispatch();
  const frozen = useSelector((state) => state.visiblePanels?.visibility);

  return (
    <MiewViewer
      {...props}
      frozen={frozen}
      updateLoadingStage={(title) => dispatch(updateLoadingStage(title))}
    />
  );
};

export default MiewViewerContainer;
