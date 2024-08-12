import { connect } from 'react-redux';

import DisplayPrefence from '../components/menu/displayPreference/DisplayPreference.jsx';
import { showDisplayColor } from '../actions';

const mapStateToProps = (state) => ({
  options: state.info.colorers,
  viewer: state.info.viewer,
});

const mapDispatchToProps = (dispatch) => ({
  showDisplayPreference: () => (dispatch(showDisplayColor())),
});

export default connect(mapStateToProps, mapDispatchToProps)(DisplayPrefence);
