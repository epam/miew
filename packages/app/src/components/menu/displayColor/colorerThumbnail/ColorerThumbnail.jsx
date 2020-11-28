import React from 'react';

const ColorThumbnail = ({
  shortName, id, onClick, selected,
}) => <div onClick={onClick} className="colorer-thumbnail small" >
    <img src={`images/colorer/${id}.png`}/>
    {/* I think classnames https://www.npmjs.com/package/classnames should be used here */}
    <p className={selected ? 'colorer-thumbnail-name selected' : 'colorer-thumbnail-name'}>{shortName}</p>
    </div>;

export default ColorThumbnail;
