import { connect } from 'react-redux';

import PanelsList from '../components/menu/panelslist/PanelsList.jsx';

const mapStateToProps = (state) => ({
  visibility: state.visiblePanels.visibility ? 'visible' : 'hidden' ,
});

const VisiblePanelsList = connect(
  mapStateToProps,
)(PanelsList);

export default VisiblePanelsList;
