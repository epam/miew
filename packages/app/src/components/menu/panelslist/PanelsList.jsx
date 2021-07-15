import React, { useState, useMemo } from 'react';
import { FaInfoCircle, FaFolderOpen, FaQuestionCircle } from 'react-icons/fa';
import { BsImage } from 'react-icons/bs';
import { ImEye } from 'react-icons/im';

import InfoPanel from '../../../containers/InfoPanelContainer';
import AboutPanel from '../../../containers/AboutPanelContainer';
import ToolsPanel from '../../../containers/ToolsPanelContainer';
import RenderSettingsPanel from '../../../containers/RenderSettingsPanelContainer';
import PanelsListButton from './PanelsListButton.jsx';
import './PanelsList.scss';

const panels = [
  {
    name: 'Info',
    Icon: FaInfoCircle,
  },
  {
    name: 'Load',
    Icon: FaFolderOpen,
  },
  {
    name: 'Gallery',
    Icon: FaFolderOpen,
  },
  {
    name: 'Representations',
    Icon: BsImage,
  },
  {
    name: 'Render settings',
    Icon: ImEye,
  },
  {
    name: 'Tools',
    Icon: FaInfoCircle,
  },
  {
    name: 'About',
    Icon: FaQuestionCircle,
  },
];

function PanelsList() {
  const [selectedPanel, setSelectedPanel] = useState('Info');

  const handlePanelClick = (panel) => () => {
    setSelectedPanel(panel);
  };

  const getPanelComponent = () => {
    switch (selectedPanel) {
      case 'Info':
        return <InfoPanel />;
      case 'Render settings':
        return <RenderSettingsPanel />;
      case 'Tools':
        return <ToolsPanel />;
      case 'About':
        return <AboutPanel />;
      default:
        return <></>;
    }
  };

  const panelsButtons = useMemo(() => panels.map(({ name, Icon }, index) => {
    const active = name === selectedPanel;
    return (
      <PanelsListButton
        active={active}
        name={name}
        key={index}
        Icon={Icon}
        handlePanelClick={handlePanelClick(name)}
      />
    );
  }), [selectedPanel]);

  return (
    <div className="panels-list">
      <div className="list-group panels-list-menu">{panelsButtons}</div>
      <div className="panel">
        <div className="panel-name">{selectedPanel}</div>
        {getPanelComponent()}
      </div>
    </div>
  );
}

PanelsList.defaultProps = {
  visibility: 'hidden',
};

export default PanelsList;
