import React, { useRef } from 'react'

import Menu from '../containers/MenuContainer'
import Viewer from '../containers/MiewViewerContainer'
import Miew from 'miew-react'
import './App.scss'
import { createRef } from 'react'
import { useEffect, miewRef } from 'react'

const opts = {
  // load: ['2FD7', { sourceType: 'immediate', fileType: 'cml' }],
  // load: '1CRN',
  reps: [
    {
      mode: 'BS'
    }
  ],
  settings: {
    autoPreset: false,
    bg: { color: 0x202020 },
    editing: true,
    inversePanning: true
  }
}

// export default class App extends React.Component {
//   constructor(props) {
//     super(props)
//     this._viewer = null
//     this._onViewerChange = this._onViewerChange.bind(this)
//     // this.setMiewRef = (data) => {
//     //   console.log("set miew ref", data);
//     // };
//     this.miewRef = createRef();
//   }

//   componentDidMount() {
//     console.log('ref in app', this.miewRef)
//   }

//   _onViewerChange(changed) {
//     if (changed.viewer !== undefined) {
//       this._viewer = changed.viewer
//     }
//     this.forceUpdate()
//   }

//   render() {
//     return (
//       <div className="root" style={{width: '80vw', height: '80vh', margin: '0 auto'}} >
//         {/* <Viewer onChange={this._onViewerChange} />
//         <Menu /> */}
//         <Miew options={opts} ref={ this.miewRef }/>
//       </div>
//     )
//   }
// }

const App = () => {

  const miewRef = useRef(null)

  useEffect(() => {
    console.log('in FN App', miewRef.current.load)
    miewRef.current.load('4TNF', { sourceType: 'url' })
    setTimeout(() => {
      miewRef.current.load('1CRN', { sourceType: 'url' })
    }, 4000)
  }, [])

  return (
    <div className="root" style={{width: '80vw', height: '80vh', margin: '0 auto'}} >
    {/* <Viewer onChange={this._onViewerChange} />
    <Menu /> */}
    <Miew options={opts} ref={miewRef}/>
  </div>
  )
}

export default App