import ACTIONS from '../constants';

export const showNav = (enable) => ({ // TODO rename to toggle
  type: ACTIONS.SHOW_NAV,
  visible: enable,
});

export const sendInfo = (ids) => ({
  type: ACTIONS.SEND_INFO,
  payload: ids,
});

export const updateLoadingStage = (stage) => ({
  type: ACTIONS.UPDATE_LOADING_STAGE,
  payload: stage,
});
