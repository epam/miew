import { connect } from 'react-redux';

import Titlebar from '../components/menu/titlebar/Titlebar.jsx';

const mapStateToProps = (state) => ({
  loadingStage: state.info.loadingStage,
  isPanelListVisible: state.visiblePanels.isPanelListVisible,
});

export default connect(mapStateToProps)(Titlebar);
