/**
 * Default CSS definition for typescript,
 * will be overridden with file-specific definitions by rollup
 */
declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}

type SvgrComponent = React.StatelessComponent<React.SVGAttributes<SVGElement>>

declare module '*.svg' {
  // eslint-disable-next-line no-unused-vars
  const svgUrl: string
  const svgComponent: SvgrComponent
  export default svgComponent
}
