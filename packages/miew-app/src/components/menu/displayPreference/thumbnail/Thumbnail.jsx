import React from 'react';
import classNames from 'classnames';

const Thumbnail = ({
  shortName, id, onClick, selected, preferenceName,
}) => <div onClick={onClick} className="thumbnail" >
    <img src={`../images/${preferenceName}/${id}.png`}/>
    <div className={classNames('thumbnail-name small', { selected })}>{shortName}</div>
    </div>;

export default Thumbnail;
