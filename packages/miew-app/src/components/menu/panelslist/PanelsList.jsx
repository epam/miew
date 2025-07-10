import React, { useState, useMemo, useEffect } from 'react';
import {
  FaInfoCircle, FaFolderOpen, FaQuestionCircle, FaWrench,
} from 'react-icons/fa';
import { BsImage } from 'react-icons/bs';
import { ImEye, ImStarFull } from 'react-icons/im';

import {
  AboutPanel, GalleryPanel, InfoPanel, RenderSettingsPanel, ToolsPanel,
} from '../../../containers/panelContainers';
import LoadPanel from './panels/LoadPanel';
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
    Icon: ImStarFull,
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
    Icon: FaWrench,
  },
  {
    name: 'About',
    Icon: FaQuestionCircle,
  },
];

function PanelsList({ viewer }) {
  const [selectedPanel, setSelectedPanel] = useState('Info');

  useEffect(() => {
    viewer.halt();
    document.getElementsByClassName('miew-canvas')[0].classList.toggle('blur');
    return () => {
      viewer.run();
      document.getElementsByClassName('miew-canvas')[0].classList.toggle('blur');
    };
  });

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
      case 'Gallery':
        return <GalleryPanel />;
      case 'Load':
        return <LoadPanel />;
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
