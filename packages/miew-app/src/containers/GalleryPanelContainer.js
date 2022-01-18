import { connect } from 'react-redux'

import GalleryPanel from '../components/menu/panelslist/panels/GalleryPanel.jsx'

const mapStateToProps = (state) => ({
  viewer: state.info.viewer
})

export default connect(mapStateToProps)(GalleryPanel)
