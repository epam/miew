import { Theme as MuiTheme } from '@mui/material'

declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >

  const src: string
  export default src
}

interface CustomTheme {
  customTheme?: {
    palette?: {
      accent?: {
        main?: string
        dark?: string
      }
      primary?: {
        main?: string
        light?: string
        dark?: string
      }
    }
    typography?: {
      htmlFontSize?: number
    }
  }
}

declare module '@emotion/react' {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface Theme extends MuiTheme, CustomTheme {}
}
