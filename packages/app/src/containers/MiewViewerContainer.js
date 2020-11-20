import { connect } from 'react-redux';

import MiewViewer from '../components/viewer/MiewViewer.jsx';
import { sendInfo, updateLoadingStage } from '../actions';

const mapStateToProps = (state) => ({
  frozen: state.visiblePanels.visibility,
});

const mapDispatchToProps = (dispatch) => ({
  sendInfo: (ids) => dispatch(sendInfo(ids)),
  updateLoadingStage: (title) => dispatch(updateLoadingStage(title)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MiewViewer);
