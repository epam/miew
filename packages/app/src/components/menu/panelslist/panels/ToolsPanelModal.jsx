import React from 'react';

const ToolsPanelModal = ({ title, body, onClose }) => <div className="modal" tabIndex="-1" role="dialog">
<div className="modal-dialog modal-dialog-centered" role="document">
  <div className="modal-content">
    <div className="modal-header">
      <h5 className="modal-title">{title}</h5>
      <button type="button" className="close" onClick={onClose} data-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div className="modal-body">
      <p>{body}</p>
    </div>
    <div className="modal-footer">
      <button type="button" className="btn btn-secondary" onClick={onClose} data-dismiss="modal">Close</button>
    </div>
  </div>
</div>
</div>;

export default ToolsPanelModal;
