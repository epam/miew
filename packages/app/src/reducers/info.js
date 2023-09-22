import ACTIONS from '../constants';

const info = (state = {}, action = {}) => {
  switch (action.type) {
    case ACTIONS.SEND_INFO:
      return { ...state, complex: action.payload };
    case ACTIONS.UPDATE_LOADING_STAGE:
      return { ...state, loadingStage: action.payload };
    case ACTIONS.SAVE_COLORERS:
      return { ...state, colorers: action.payload };
    case ACTIONS.SAVE_MODES:
      return { ...state, modes: action.payload };
    case ACTIONS.SAVE_VIEWER:
      return { ...state, viewer: action.payload };
    case ACTIONS.CHANGE_THEME:
      return { ...state, theme: action.payload };
    default:
      return state;
  }
};

export default info;
