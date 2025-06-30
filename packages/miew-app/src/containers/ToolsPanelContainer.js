import { connect } from 'react-redux';

import ToolsPanel from '../components/menu/panelslist/panels/ToolsPanel/ToolsPanel.jsx';

const mapStateToProps = (state) => ({
  viewer: state.info.viewer,
});

export default connect(mapStateToProps)(ToolsPanel);
