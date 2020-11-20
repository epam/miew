import { connect } from 'react-redux';

import Titlebar from '../components/menu/titlebar/Titlebar.jsx';

const mapStateToProps = (state) => ({
  loadingStage: state.info.loadingStage,
});

export default connect(mapStateToProps)(Titlebar);
