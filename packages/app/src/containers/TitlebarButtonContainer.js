import { connect } from 'react-redux';

import TitlebarButton from '../components/menu/titlebar/titlebarButton/TitlebarButton.jsx';

const mapDispatchToProps = (dispatch) => ({
  onClick: (dispatchFunction) => {
    dispatch(dispatchFunction());
  },
});

export default connect(null, mapDispatchToProps)(TitlebarButton);
