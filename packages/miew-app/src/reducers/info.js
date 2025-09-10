import ACTIONS from '../constants';

const info = (state = {}, action = {}) => {
  switch (action.type) {
    case ACTIONS.UPDATE_LOADING_STAGE:
      return { ...state, loadingStage: action.payload };
    case ACTIONS.CHANGE_THEME:
      return { ...state, theme: action.payload };
    default:
      return state;
  }
};

export default info;
