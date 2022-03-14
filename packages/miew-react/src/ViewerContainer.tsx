import { Viewer } from './Viewer'
import { Provider } from 'react-redux'
import { store } from 'state'

export const ViewerContainer = (props) => {
  return (
    <Provider store={store}>
      <Viewer {...props} />
    </Provider>
  )
}
