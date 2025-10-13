import { connect } from 'react-redux';

import ToolsPanel from '../../components/menu/panelslist/panels/ToolsPanel';

const mapStateToProps = (state) => ({
  viewer: state.info.viewer,
});

export default connect(mapStateToProps)(ToolsPanel);
