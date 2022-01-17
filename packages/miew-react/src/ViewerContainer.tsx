import { Provider } from 'react-redux'
import { store } from 'state'
import { Viewer } from './Viewer'
import _ from 'lodash'
import { Theme, ThemeProvider } from '@emotion/react'
import { mainTheme } from 'src/theming'
import { createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

const muiTheme = createTheme()

export const ViewerContainer = (props) => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={_.merge(muiTheme, mainTheme) as Theme}>
        <CssBaseline />
        <Viewer {...props} />
      </ThemeProvider>
    </Provider>
  )
}
