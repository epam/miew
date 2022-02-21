import { MiewTheme } from './theme.types'

export const defaultTheme: MiewTheme = {
  palette: {
    accent: {
      main: '#2E6DA4',
      dark: '#204D74',
      light: '#337AB7'
    },
    primary: {
      main: '#DDD',
      light: '#FFF',
      dark: '#404040'
    },
    secondary: {
      main: '#333',
      light: '#C0C0C0',
      dark: '#383838'
    }
  },
  typography: {
    fontSize: 16,
    fontFamily: 'sans-serif'
  }
}
