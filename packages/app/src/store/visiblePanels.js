const visiblePanels = (state = [], action) => {
  switch (action.type) {
    case 'SHOW_NAV': // TODO rename?
      return { visibility: !state.visibility };
    default:
      return state;
  }
};

export default visiblePanels;
