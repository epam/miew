import React, { useState } from 'react';
import { FaInfoCircle, FaQuestionCircle } from 'react-icons/fa';
import { BsImage } from 'react-icons/bs';
import { ImEye } from 'react-icons/im';

import './ToolsPanel.scss';
import ToolsPanelModal from './ToolsPanelModal.jsx';

const ToolsPanel = ({ viewer }) => {
  const [open, setOpen] = useState();
  const panels = [
    {
      name: 'Assign secondary structure',
      handler: () => {
        viewer.dssp();
      },
      Icon: FaInfoCircle,
    },
    {
      name: 'Reset view',
      handler: () => viewer.resetView(),
      Icon: FaInfoCircle,
    },
    {
      name: 'Screenshot',
      handler: () => viewer.screenshotSave(),
      Icon: FaInfoCircle,
    },
    {
      name: 'Get URL',
      handler: () => setOpen('get-url'),
      Icon: BsImage,
    },
    {
      name: 'Get script',
      handler: () => setOpen('get-script'),
      Icon: BsImage,
    },
    {
      name: 'Save settings',
      handler: () => {
        viewer.saveSettings();
      },
      Icon: ImEye,
    },
    {
      name: 'Restore settings',
      handler: () => {
        viewer.restoreSettings();
      },
      Icon: FaInfoCircle,
    },
    {
      name: 'Reset settings',
      handler: () => {
        viewer.resetSettings();
      },
      Icon: FaQuestionCircle,
    },
    {
      name: 'Export FBX',
      handler: () => {
        viewer.save({ fileType: 'fbx' });
      },
      Icon: FaQuestionCircle,
    },
  ];

  const menu = panels.map(({ name, handler, Icon }, index) => (
    <li key={index} onClick={handler} className='list-group-item'>
      {name}
      <Icon />
    </li>
  ));

  return (
    <>
      <ul className='list-group tools'>{menu}</ul>
      {open === 'get-url' && (
        <ToolsPanelModal
          title={'URL'}
          body={viewer.getURL()}
          onClose={() => setOpen('')}
        />
      )}
      {open === 'get-script' && (
        <ToolsPanelModal
          title={'Script'}
          body={viewer.getScript()}
          onClose={() => setOpen('')}
        />
      )}
    </>
  );
};
export default ToolsPanel;
