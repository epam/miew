import ACTIONS from '../constants';

const info = (state = {}, action) => {
  switch (action.type) {
    case ACTIONS.SEND_INFO:
      return { ...state, complexes: action.payload };
    case ACTIONS.UPDATE_LOADING_STAGE:
      return { ...state, loadingStage: action.payload };
    default:
      return state;
  }
};

export default info;
