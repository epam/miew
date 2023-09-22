import ACTIONS from '../constants';

const visiblePanels = (state = {}, action = {}) => {
  switch (action.type) {
    case ACTIONS.SHOW_NAV:
      return { ...state, isPanelListVisible: !state.isPanelListVisible };
    case ACTIONS.SHOW_TERMINAL:
      return { ...state, isTerminalVisible: !state.isTerminalVisible };
    case ACTIONS.SHOW_DISPLAY_MODE:
      return { ...state, isDisplayModeVisible: !state.isDisplayModeVisible };
    case ACTIONS.SHOW_DISPLAY_COLOR:
      return { ...state, isDisplayColorVisible: !state.isDisplayColorVisible };
    default:
      return state;
  }
};

export default visiblePanels;
