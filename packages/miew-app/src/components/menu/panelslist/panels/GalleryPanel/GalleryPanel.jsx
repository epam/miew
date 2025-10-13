import React from 'react';
import { useDispatch } from 'react-redux';

import { showNav } from '../../../../../actions';

import './GalleryPanel.scss';

const galleryPanels = [
  {
    label: 'Serotonin',
    image: 'serotonin',
    value: 'pc:serotonin',
    query: 'p=small&mt=ME&v=1P1erPnlYqD3sL7u8kNxQPmZl0L4NUDlA0c6VPg%3D%3D',
  },
  {
    label: (
      <>
        1CRN <small>(0.3k)</small>
      </>
    ),
    image: '1CRN',
    value: '1CRN',
    query: 'p=macro',
  },
  {
    label: (
      <>
        1AID <small>(1.6k)</small>
      </>
    ),
    image: '1AID',
    value: '1AID',
    query:
      'p=macro&m=CS&c=CH&r=1&s=hetatm+and+altloc+A&v=1XA99wmIQG8LRIls%2BLXGoPRDqTb%2BdvOC/PEyQPg%3D%3D',
  },
  {
    label: (
      <>
        2BFU <small>(5.2k)</small>
      </>
    ),
    image: '2BFU',
    value: '2BFU',
    query:
      'p=macro&c=CH&r=2&s=all&m=CS&c=CH&mt=TR&v=1AAAAgAAAAIAAAACAAtq6O7plpT4VEF6%2B1/WQPQ%3D%3D',
  },
  {
    label: (
      <>
        5B40 <small>(11.8k)</small>
      </>
    ),
    image: '5B40',
    value: '5B40',
    query:
      'p=macro&r=2&s=nucleic&m=CS&c=SS&mt=TR&v=1EBjRwvhTz0CYbo7BE0KGPBxejb/3yk2//Wb1vg%3D%3D',
  },
  {
    label: (
      <>
        4TNW <small>(30.4k)</small>
      </>
    ),
    image: '4TNW',
    value: 'cif:4TNW',
    query: 'p=macro&c=SQ&v=1xQCuQgIrbUHD9arAmmsnPIj8NL/mF6u%2Bx26BPg%3D%3D',
  },
];

function GalleryPanel({ viewer }) {
  const dispatch = useDispatch();

  const renderGalleryButtons = () => galleryPanels.map(({
    label, image, value, query,
  }, index) => (
      <div
        key={index}
        className="gallery-panel-button"
        onClick={() => {
          dispatch(showNav());
          viewer.load(value).then(() => viewer.setOptions(query || ''));
        }}
      >
        <img src={`images/${image}.png`} />
        <div className="gallery-panel-button-label">{label}</div>
      </div>
  ));

  return (
    <div className="gallery-panel">
      <div className="gallery-images">{renderGalleryButtons()}</div>
    </div>
  );
}

export default GalleryPanel;
