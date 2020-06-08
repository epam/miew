import { connect } from 'react-redux';

import { showNav, updateInfo } from '../actions';
import TitlebarButton from '../components/menu/titlebar/titlebutton/TitleButton.jsx';

const mapDispatchToProps = (dispatch) => ({
  onClick: (enable) => {
    dispatch(showNav(enable));
    dispatch(updateInfo());
  },
});

export default connect(null, mapDispatchToProps)(TitlebarButton);
