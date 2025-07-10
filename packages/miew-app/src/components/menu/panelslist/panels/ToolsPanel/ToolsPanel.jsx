import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import { BiLogIn, BiLogOut, BiRefresh } from 'react-icons/bi';
import { RiArrowUpDownFill, RiSave3Fill, RiCameraFill } from 'react-icons/ri';
import { BsLink45Deg, BsFileText } from 'react-icons/bs';

import { showNav } from '../../../../../actions';

import './ToolsPanel.scss';

const ToolsPanel = ({ viewer }) => {
  const dispatch = useDispatch();
  const [modelInfo, setModelInfo] = useState({});
  const panels = [
    {
      name: 'Assign secondary structure',
      handler: () => {
        dispatch(showNav());
        viewer.dssp();
      },
      Icon: RiArrowUpDownFill,
    },
    {
      name: 'Reset view',
      handler: () => {
        dispatch(showNav());
        viewer.resetView();
      },
      Icon: BiRefresh,
    },
    {
      name: 'Screenshot',
      handler: () => {
        dispatch(showNav());
        viewer.screenshotSave();
      },
      Icon: RiCameraFill,
    },
    {
      name: 'Get URL',
      handler: () => setModelInfo({ title: 'URL', isOpen: true, body: viewer.getURL({ settings: true, view: true }) }),
      Icon: BsLink45Deg,
    },
    {
      name: 'Get script',
      handler: () => setModelInfo({ title: 'Script', isOpen: true, body: viewer.getScript() }),
      Icon: BsFileText,
    },
    {
      name: 'Save settings',
      handler: () => {
        dispatch(showNav());
        viewer.saveSettings();
      },
      Icon: BiLogIn,
    },
    {
      name: 'Restore settings',
      handler: () => {
        dispatch(showNav());
        viewer.restoreSettings();
      },
      Icon: BiLogOut,
    },
    {
      name: 'Reset settings',
      handler: () => {
        dispatch(showNav());
        viewer.resetSettings();
      },
      Icon: BiRefresh,
    },
    {
      name: 'Export FBX',
      handler: () => {
        dispatch(showNav());
        viewer.save({ fileType: 'fbx' });
      },
      Icon: RiSave3Fill,
    },
  ];

  const renderToolsPanelModal = () => (
    <Modal show={modelInfo.isOpen} onHide={() => setModelInfo({})}>
      <Modal.Header closeButton>
        <Modal.Title>{modelInfo.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{modelInfo.body}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setModelInfo({})}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const menu = panels.map(({ name, handler, Icon }, index) => (
    <li key={index} onClick={handler} className="list-group-item">
      <Icon />
      {name}
    </li>
  ));

  return (
    <div className="tools-panel">
      <ul className="list-group tools">{menu}</ul>
      {renderToolsPanelModal()}
    </div>
  );
};
export default ToolsPanel;
