import { connect } from 'react-redux';

import DisplayColor from '../components/menu/displayColor/DisplayColor.jsx';
import { showDisplayColor } from '../actions';

const mapStateToProps = (state) => ({
  colorers: state.info.colorers,
  viewer: state.info.viewer,
});

const mapDispatchToProps = (dispatch) => ({
  showDisplayColor: () => (dispatch(showDisplayColor())),
});

export default connect(mapStateToProps, mapDispatchToProps)(DisplayColor);
