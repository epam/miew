import { Provider } from 'react-redux'
import { store } from 'state'
import { App } from 'components/App'
import _ from 'lodash'
import { Theme, ThemeProvider } from '@emotion/react'
import { mainTheme } from 'src/theming'
import { createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

const muiTheme = createTheme()

export const AppContainer = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={_.merge(muiTheme, mainTheme) as Theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  )
}
