import { connect } from 'react-redux';

import { showNav } from '../actions';
import TitlebarButton from '../components/menu/titlebar/titlebutton/TitleButton.jsx';

const mapDispatchToProps = (dispatch) => ({
  onClick: (enable) => dispatch(showNav(enable)),
});

export default connect(null, mapDispatchToProps)(TitlebarButton);
