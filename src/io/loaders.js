import LoaderList from './loaders/LoaderList';

import FileLoader from './loaders/FileLoader';
import XHRLoader from './loaders/XHRLoader';
import ImmediateLoader from './loaders/ImmediateLoader';

export default new LoaderList([
  // note: order might be important
  FileLoader,
  XHRLoader,
  ImmediateLoader,
]);
