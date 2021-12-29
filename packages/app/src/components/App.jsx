import React from 'react'

import Menu from '../containers/MenuContainer'
import Viewer from '../containers/MiewViewerContainer'
import Miew from 'miew-react'
import './App.scss'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this._viewer = null
    this._onViewerChange = this._onViewerChange.bind(this)
  }

  _onViewerChange(changed) {
    if (changed.viewer !== undefined) {
      this._viewer = changed.viewer
    }
    this.forceUpdate()
  }

  render() {
    return (
      <div className="root" style={{width: '80vw', height: '80vh', margin: '0 auto'}} >
        {/* <Viewer onChange={this._onViewerChange} />
        <Menu /> */}
        <Miew />
      </div>
    )
  }
}
