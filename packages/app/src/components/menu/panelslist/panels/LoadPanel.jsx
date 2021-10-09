import React from 'react';
import Switch from 'bootstrap-switch-button-react';
import { InputGroup, FormControl, Button } from 'react-bootstrap';
import { FaFolderOpen } from 'react-icons/fa';

import './LoadPanel.scss';

function LoadPanel() {
  return (
    <div className="load-panel">
     <div className="data-load-label">Data to load</div>
      <InputGroup className="mb-3">
        <FormControl size="sm" placeholder="PDB ID or URL..." />
        <InputGroup.Text className="load-button">
          <FaFolderOpen />
          <input type="file" />
        </InputGroup.Text>
      </InputGroup>
      <Button>Load</Button>
      <ul className="list-group">
        <li className="list-group-item">
          <label>Automatic preset on load</label>
          <Switch size="xs" onlabel="ON" offlabel="OFF" />
        </li>
      </ul>
    </div>
  );
}

export default LoadPanel;
