import React from 'react';
import classNames from 'classnames';

const PanelsListButton = ({
  name, active, handlePanelClick, Icon,
}) => (
  <button
    type="button"
    onClick={() => handlePanelClick(name)}
    className={classNames('list-group-item', 'list-group-item-action', {
      active,
    })}
  >
    <Icon />
     {name}
  </button>
);

export default PanelsListButton;
