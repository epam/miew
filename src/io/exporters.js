import ExporterList from './exporters/ExporterList';

import PDBExporter from './exporters/PDBExporter';
import DUMBExporter from './exporters/DUMBExporter';

import Exporter from "./exporters/Exporter";

export const exporters = new ExporterList([PDBExporter, DUMBExporter]);
