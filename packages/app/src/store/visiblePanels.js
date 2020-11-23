import ACTIONS from '../constants';

const visiblePanels = (state = {}, action) => {
  switch (action.type) {
    case ACTIONS.SHOW_NAV:
      return { ...state, visibility: !state.visibility };
    default:
      return state;
  }
};

export default visiblePanels;
