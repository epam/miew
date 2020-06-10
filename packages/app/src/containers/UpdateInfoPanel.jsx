import { connect } from 'react-redux';

import InfoPanel from '../components/menu/panelslist/panels/InfoPanel.jsx';

const mapStateToProps = (state) => ({
  id: state.info.complexes ? state.info.complexes.join(';') : 'none',
});

export default connect(mapStateToProps)(InfoPanel);
