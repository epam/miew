import { connect } from 'react-redux';

import AboutPanel from '../../components/menu/panelslist/panels/AboutPanel';

const mapStateToProps = (state) => ({
  version: state.info.viewer.VERSION,
});

export default connect(mapStateToProps)(AboutPanel);
