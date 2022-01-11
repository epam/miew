import { Provider } from 'react-redux'
import { store } from 'state'
import { Viewer } from './Viewer'

export const ViewerContainer = (props) => {
  return (
    <Provider store={store}>
      <Viewer {...props} />
    </Provider>
  )
}
