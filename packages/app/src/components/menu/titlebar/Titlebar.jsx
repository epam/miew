import React from 'react';

import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import LeftButtons from './leftbuttons/LeftButtons.jsx';
import RightButtons from './rightbuttons/RightButtons.jsx';

const style = {
  display: 'flex',
  color: 'var(--titlebar-color)',
  // height: 'var(--titlebar-height)',
  justifyContent: 'space-between',
  backgroundColor: 'rgba(var(--titlebar-gray), var(--titlebar-gray), var(--titlebar-gray), var(--titlebar-alpha))',
};

export default class Titlebar extends React.Component {
  render() {
    return <ButtonToolbar style = { style }>
      <LeftButtons/>
      <span data-field="title">3D Molecular Viewer</span>
      <RightButtons/>

      {/* <div className="btns-miew-titlebar btns-miew-titlebar-left btns-miew-titlebar-main-menu"> */}
      {/*  <button className="btn btn-default btn-titlebar" data-toggle="miew-main-menu" data-state="on" */}
      {/*          data-tooltip="tooltip" data-placement="bottom" title="Open menu"> */}
      {/*    <span className="glyphicon glyphicon-menu-hamburger"></span> */}
      {/*  </button> */}

      {/*  <button id="miew-terminal-btn" type="button" className="btn btn-default btn-titlebar" */}
      {/*          data-toggle="miew-terminal" data-state="on" data-tooltip="tooltip" data-placement="bottom" */}
      {/*          title="Terminal"> */}
      {/*    <span className="glyphicon glyphicon-menu-right"></span> */}
      {/*  </button> */}
      {/* </div> */}

      {/* <div className="blog-nav btns-miew-titlebar btns-miew-titlebar-right btns-miew-titlebar-toolbar"> */}

      {/*   <button type="button" className="btn btn-default btn-titlebar blog-nav-item" data-toggle="toolbar" */}
      {/*           data-value="miew-menu-toolbar-mode" data-tooltip="tooltip" data-placement="bottom" title="Display mode"> */}
      {/*     <span className="glyphicon glyphicon-picture"></span> */}
      {/*   </button> */}

      {/*   <button type="button" className="btn btn-default btn-titlebar blog-nav-item" data-toggle="toolbar" */}
      {/*           data-value="miew-menu-toolbar-colorer" data-tooltip="tooltip" data-placement="bottom" */}
      {/*           title="Display color"> */}
      {/*     <span className="glyphicon glyphicon-tint"></span> */}
      {/*   </button> */}
      {/* </div> */}
    </ButtonToolbar>;
  }
}
