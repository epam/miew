import { connect } from 'react-redux';

import Viewer from '../components/viewer/ViewerContainer.jsx';

const mapStateToProps = (state) => ({
  frozen: state.visiblePanels.visibility,
});

export default connect(mapStateToProps)(Viewer);
