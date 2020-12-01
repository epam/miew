import React from 'react';
import classNames from 'classnames';

const ColorThumbnail = ({
  shortName, id, onClick, selected,
}) => <div onClick={onClick} className="colorer-thumbnail small" >
    <img src={`../images/colorer/${id}.png`}/>
    <p className={classNames('colorer-thumbnail-name', { selected })}>{shortName}</p>
    </div>;

export default ColorThumbnail;
