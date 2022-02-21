import { StatusPanel } from './StatusPanel'
import { render, screen } from '@testing-library/react'
import { combineReducers, createStore } from 'redux'
import { Provider } from 'react-redux'
import { statusReducer } from 'state/status/statusSlice'
import { ThemeProvider } from '@emotion/react'
import { defaultTheme } from 'theming'
import { merge } from 'lodash'
import { createTheme } from '@mui/material/styles'
import { UPDATE_STATUS } from 'state/status'
import '@testing-library/jest-dom'

const theme = merge(createTheme(), { miew: defaultTheme })
const testStatus = 'TEST'

describe('StatusPanel component', () => {
  it('should display status stored in store', () => {
    const store = createStore(combineReducers({ status: statusReducer }))
    store.dispatch({ type: UPDATE_STATUS, payload: testStatus })
    render(<StatusPanel />, {
      wrapper: ({ children }) => {
        return (
          <Provider store={store}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
          </Provider>
        )
      }
    })
    expect(screen.getByText(testStatus)).toBeInTheDocument()
  })
})
