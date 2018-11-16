import ExporterList from './exporters/ExporterList';

import PDBExporter from './exporters/PDBExporter';

export const exporters = new ExporterList([PDBExporter]);
