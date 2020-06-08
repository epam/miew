export const showNav = (enable) => ({ // TODO rename to toggle
  type: 'SHOW_NAV',
  visible: enable,
});

export const sendInfo = (ids) => ({
  type: 'SEND_INFO',
  payload: ids,
});
