import { connect } from 'react-redux';

import PanelsList from '../components/menu/panelslist/PanelsList.jsx';

// push complexes info to the panel
const mapStateToProps = () => ({
});

const VisiblePanelsList = connect(
  mapStateToProps,
)(PanelsList);

export default VisiblePanelsList;
