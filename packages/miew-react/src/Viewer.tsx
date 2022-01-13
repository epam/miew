import { useLayoutEffect, useRef } from 'react'
// import useResizeObserver from 'use-resize-observer'
import Miew from 'miew'
// import styled from '@emotion/styled'

// const MEDIA_SIZES = {
//   smallWidth: 800,
//   smallHeight: 400
// }

type ViewerProps = {
  onInit?: (miew: object) => void
  options?: object
}

const Viewer = (props: ViewerProps) => {
  const ref = useRef<HTMLDivElement>(null)
  // const { width, height } = useResizeObserver<HTMLDivElement>({ ref })
  const { onInit, options } = props

  console.log(props)

  // const ViewerArea = styled.div(({theme}) => {
  //   const isSmallArea = (height && height <= MEDIA_SIZES.smallHeight) || (width && width <= MEDIA_SIZES.smallWidth)
  //   return {
  //     backgroundColor: isSmallArea ?`${theme.customTheme?.palette?.primary?.dark}` : `${theme.customTheme?.palette?.primary?.light}`,
  //     width: '100%',
  //     height: '100%'
  //   }
  // })

  useLayoutEffect(() => {
    const miew = new Miew({
      container: ref?.current,
      ...options
    })
    if (miew.init()) miew.run()
    if (typeof onInit === 'function') onInit(miew)
  }, [onInit, options])

  return <div ref={ref} style={{ width: '100%', height: '100%'}}></div>
}

export { Viewer }
