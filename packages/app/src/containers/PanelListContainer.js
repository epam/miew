import { connect } from 'react-redux';

import PanelsList from '../components/menu/panelslist/PanelsList.jsx';

// push complexes info to the panel
const mapStateToProps = (state) => ({
  viewer: state.info.viewer,
});

const VisiblePanelsList = connect(
  mapStateToProps,
)(PanelsList);

export default VisiblePanelsList;
