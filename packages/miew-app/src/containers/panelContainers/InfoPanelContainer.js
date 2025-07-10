import { connect } from 'react-redux';

import InfoPanel from '../../components/menu/panelslist/panels/InfoPanel';

const mapStateToProps = (state) => ({
  complex: state.info.complex,
});

export default connect(mapStateToProps)(InfoPanel);
