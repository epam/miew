import React from 'react';
import classNames from 'classnames';

const ColorThumbnail = ({
  shortName, id, onClick, selected,
}) => <div onClick={onClick} className="colorer-thumbnail" >
    <img src={`../images/colorer/${id}.png`}/>
    <div className={classNames('colorer-thumbnail-name small', { selected })}>{shortName}</div>
    </div>;

export default ColorThumbnail;
