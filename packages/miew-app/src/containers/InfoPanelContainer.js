import { connect } from 'react-redux'

import InfoPanel from '../components/menu/panelslist/panels/InfoPanel.jsx'

const mapStateToProps = (state) => ({
  complex: state.info.complex
})

export default connect(mapStateToProps)(InfoPanel)
