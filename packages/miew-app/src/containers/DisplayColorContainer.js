import { connect } from 'react-redux';

import DisplayPrefence from '../components/menu/displayPreference/DisplayPreference.jsx';
import { showDisplayColor } from '../actions';

const mapStateToProps = () => ({
});

const mapDispatchToProps = (dispatch) => ({
  showDisplayPreference: () => (dispatch(showDisplayColor())),
});

export default connect(mapStateToProps, mapDispatchToProps)(DisplayPrefence);
