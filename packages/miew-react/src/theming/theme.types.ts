type ColorSet = {
  main: string
  light: string
  dark: string
}

export interface MiewTheme {
  palette: {
    accent: ColorSet
    primary: ColorSet
    secondary: ColorSet
  }
  typography: {
    fontSize: number
    fontFamily: string
  }
}
