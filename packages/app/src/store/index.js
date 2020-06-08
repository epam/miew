import { combineReducers } from 'redux';
import visiblePanels from './visiblePanels';
import info from './info';

export default combineReducers({
  visiblePanels,
  info,
});
