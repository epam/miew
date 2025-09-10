import { connect } from 'react-redux';

import DisplayPreferences from '../components/menu/displayPreference/DisplayPreference.jsx';
import { showDisplayMode } from '../actions';

const mapStateToProps = (state) => ({
  options: state.info.modes,
});

const mapDispatchToProps = (dispatch) => ({
  showDisplayPreference: () => (dispatch(showDisplayMode())),
});

export default connect(mapStateToProps, mapDispatchToProps)(DisplayPreferences);
