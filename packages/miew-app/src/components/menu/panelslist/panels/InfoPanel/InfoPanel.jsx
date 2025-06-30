import React from 'react';
import Table from 'react-bootstrap/Table';

import './InfoPanel.scss';

const InfoPanel = ({ complex }) => {
  const { name, metadata } = complex[0];
  const { classification, title, id } = metadata;

  const isTitleProvided = title !== undefined;
  const molecules = complex[0].getMolecules();

  const statistics = [
    {
      label: 'Atoms',
      value: complex[0].getAtomCount(),
    },
    {
      label: 'Bonds',
      value: complex[0].getBondCount(),
    },
    {
      label: 'Residues',
      value: complex[0].getResidueCount(),
    },
    {
      label: 'Chains',
      value: complex[0].getChainCount(),
    },
    {
      label: 'Molecules',
      value: complex[0].getMoleculeCount(),
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
