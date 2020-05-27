export const showNav = (enable) => ({
  type: 'SHOW_NAV',
  visible: enable,
});

export const showPanel = (id, enable) => ({
  type: 'SHOW_PANEL',
  id,
  visible: enable,
});
