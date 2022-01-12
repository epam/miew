import { Theme as MuiTheme } from '@mui/material'

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >

  const src: string
  export default src
}

declare module '@emotion/react' {
  interface Theme {
    customTheme?: {
      palette?: {
        accent?: {
          main?: string,
          dark?: string
        },
        primary?: {
          main?: string,
          light?: string,
          dark?: string
        }
      },
      typography?: {
        htmlFontSize?: number
      }
    }
  }
}

declare module '@emotion/react' {
  export interface Theme extends MuiTheme {}
}
