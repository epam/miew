import { Provider } from 'react-redux'
import { store } from 'state'
import { App } from 'components/App/App'
import { forwardRef } from 'react'

export const AppContainer = forwardRef<HTMLDivElement, {}>((props, ref) => {
  return (
    <Provider store={store}>
      <App {...props} ref={ref} />
    </Provider>
  )
})
