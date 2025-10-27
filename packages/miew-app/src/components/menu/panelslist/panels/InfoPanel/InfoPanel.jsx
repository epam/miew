import React from 'react';
import Table from 'react-bootstrap/Table';

import { useMiew } from '../../../../../contexts/MiewContext';
import './InfoPanel.scss';

const InfoPanel = () => {
  const viewer = useMiew();

  // TODO: Replace with public API when available
  const complex = viewer?._getComplexVisual()?.getComplex();
  if (!complex) {
    return <div className="info-panel">No data loaded</div>;
  }

  const { name, metadata } = complex;
  const { classification, title, id } = metadata;

  const isTitleProvided = title !== undefined;
  const molecules = complex.getMolecules();

  const statistics = [
    {
      label: 'Atoms',
      value: complex.getAtomCount(),
    },
    {
      label: 'Bonds',
      value: complex.getBondCount(),
    },
    {
      label: 'Residues',
      value: complex.getResidueCount(),
    },
    {
      label: 'Chains',
      value: complex.getChainCount(),
    },
    {
      label: 'Molecules',
      value: complex.getMoleculeCount(),
    },
  ];

  const rendeStatistics = () => statistics.map(({ label, value }, index) => (
      <tr key={index}>
        <td>{label}</td>
        <td className="text-center">{value}</td>
      </tr>
  ));

  const renderMolecules = () => molecules.map(({ name: moleculeName }, index) => (
      <li key={index}>{moleculeName}</li>
  ));

  return (
    <div className="info-panel">
      <h1>
        {id || name || 'Unknown data'}
        {classification && <small> / {classification}</small>}
      </h1>
      <p>{isTitleProvided ? title.join(' ') : ''}</p>
      <Table>
        <thead>
          <tr>
            <th>Statistics</th>
            <th className="text-center">Value</th>
          </tr>
        </thead>
        <tbody>{rendeStatistics()}</tbody>
      </Table>
      <Table>
        <thead>
          <tr>
            <th>Molecules</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ol>{renderMolecules()}</ol>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

InfoPanel.defaultProps = {
  id: 'none',
};

export default InfoPanel;
