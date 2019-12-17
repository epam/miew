import ExporterList from './exporters/ExporterList';

import PDBExporter from './exporters/PDBExporter';
import FBXExporter from './exporters/FBXExporter';

export default new ExporterList([
  PDBExporter,
  FBXExporter,
]);
