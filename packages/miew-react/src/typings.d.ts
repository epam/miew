import { MiewTheme } from 'theming'

declare module '*.svg' {
  import * as React from 'react'
  import { ReactComponent } from 'react'

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >

  const src: ReactComponent
  export default src
}

declare module '@emotion/react' {
  export interface Theme {
    miew: MiewTheme
  }
}
