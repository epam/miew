import { connect } from 'react-redux';

import Terminal from '../components/menu/terminal/Terminal.jsx';

const mapStateToProps = (state) => ({
  viewer: state.info.viewer,
});

export default connect(mapStateToProps)(Terminal);
