const visiblePanels = (state = [], action) => {
  switch (action.type) {
    case 'SHOW_PANEL':
      return state.map((panel) => (panel.id === action.id ? { ...panel, id: panel.id, visible: action.visible } : panel));
    default:
      return state;
  }
};

export default visiblePanels;
