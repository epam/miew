import { connect } from 'react-redux';

import TitlebarButton from '../components/menu/titlebar/titlebutton/TitleButton.jsx';

const mapDispatchToProps = (dispatch) => ({
  onClick: (dispatchFunction) => {
    dispatch(dispatchFunction());
  },
});

export default connect(null, mapDispatchToProps)(TitlebarButton);
