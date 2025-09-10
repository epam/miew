import { connect } from 'react-redux';

import Terminal from '../components/menu/terminal/Terminal.jsx';

const mapStateToProps = (state) => ({
  isTerminalVisible: state.visiblePanels.isTerminalVisible,
});

export default connect(mapStateToProps)(Terminal);
