import ACTIONS from '../constants';

export const showNav = () => ({
  type: ACTIONS.SHOW_NAV,
});

export const sendInfo = (ids) => ({
  type: ACTIONS.SEND_INFO,
  payload: ids,
});

export const updateLoadingStage = (stage) => ({
  type: ACTIONS.UPDATE_LOADING_STAGE,
  payload: stage,
});

export const showTerminal = () => ({
  type: ACTIONS.SHOW_TERMINAL,
});

export const showDisplayMode = () => ({
  type: ACTIONS.SHOW_DISPLAY_MODE,
});

export const showDisplayColor = () => ({
  type: ACTIONS.SHOW_DISPLAY_COLOR,
});

export const saveColorers = (colorers) => ({
  type: ACTIONS.SAVE_COLORERS,
  payload: colorers,
});

export const saveViewer = (viewer) => ({
  type: ACTIONS.SAVE_VIEWER,
  payload: viewer,
});

export const changeTheme = (theme) => ({
  type: ACTIONS.CHANGE_THEME,
  payload: theme,
});
