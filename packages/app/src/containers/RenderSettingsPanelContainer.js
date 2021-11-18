import { connect } from 'react-redux';

import RenderSettingsPanel from '../components/menu/panelslist/panels/RenderSettingsPanel.jsx';

const mapStateToProps = (state) => ({
  viewer: state.info.viewer,
});

export default connect(mapStateToProps)(RenderSettingsPanel);
