import { connect } from 'react-redux';

import MiewViewer from '../components/viewer/MiewViewer.jsx';
import {
  sendInfo, updateLoadingStage, saveColorers, saveViewer, saveModes,
} from '../actions';

const mapStateToProps = (state) => ({
  frozen: state.visiblePanels.visibility,
  viewer: state.info.viewer,
});

const mapDispatchToProps = (dispatch) => ({
  sendInfo: (ids) => dispatch(sendInfo(ids)),
  updateLoadingStage: (title) => dispatch(updateLoadingStage(title)),
  saveColorers: (colorers) => dispatch(saveColorers(colorers)),
  saveModes: (modes) => dispatch(saveModes(modes)),
  saveViewer: (viewer) => dispatch(saveViewer(viewer)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MiewViewer);
