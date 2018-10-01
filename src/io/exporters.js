import ExporterList from './exporters/ExporterList';

import PDBExporter from './exporters/PDBExporter';
import DUMBExporter from './exporters/DUMBExporter';

export const exporters = new ExporterList([PDBExporter, DUMBExporter]);
