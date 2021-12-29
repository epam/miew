import { Provider } from 'react-redux'
import { store } from 'state'
import { App } from 'components/App/App'

export const AppContainer = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}
