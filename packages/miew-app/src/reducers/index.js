import { combineReducers } from '@reduxjs/toolkit';
import visiblePanels from './visiblePanels';
import info from './info';

export default combineReducers({
  visiblePanels,
  info,
});
