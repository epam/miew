import { connect } from 'react-redux';

import Menu from '../components/menu/Menu.jsx';

const mapStateToProps = (state) => ({
  isPanelListVisible: state.visiblePanels.isPanelListVisible,
  isDisplayColorVisible: state.visiblePanels.isDisplayColorVisible,
});

export default connect(mapStateToProps)(Menu);
