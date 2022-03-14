import { StatusPanel } from './StatusPanel'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@emotion/react'
import '@testing-library/jest-dom'
import { useAppSelector } from 'state/hooks'

jest.mock('state/hooks', () => ({
  useAppSelector: jest.fn()
}))

const theme = {
  miew: {
    palette: {
      secondary: {
        light: '#fff'
      }
    }
  }
}

describe('StatusPanel component', () => {
  it.each`
    status             | moleculeInfo       | expectedResult
    ${''}              | ${''}              | ${''}
    ${'fetching'}      | ${''}              | ${'Fetching...'}
    ${'unknownStatus'} | ${''}              | ${''}
    ${''}              | ${'molecule mode'} | ${'molecule mode'}
    ${'fetching'}      | ${'molecule mode'} | ${'molecule mode'}
    ${'unknownStatus'} | ${'molecule mode'} | ${'molecule mode'}
  `(
    'should display status, molecule info or emtpy line depending on store (infoSlice) state',
    ({ status, moleculeInfo, expectedResult }) => {
      ;(
        useAppSelector as jest.MockedFunction<typeof useAppSelector>
      ).mockImplementation(() => ({ status, moleculeInfo }))
      const { container } = render(
        <ThemeProvider theme={theme}>
          <StatusPanel />
        </ThemeProvider>
      )
      // eslint-disable-next-line
      expect(container.querySelector('span')?.innerHTML).toEqual(expectedResult) //cannot use getByRole for span
    }
  )
})
