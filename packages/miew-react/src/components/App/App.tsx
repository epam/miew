// @ts-nocheck
import { useEffect, useRef, forwardRef } from 'react'
import Miew from 'miew'

export const App = forwardRef<HTMLDivElement>((props, ref) => {
  const miewContainer = useRef<HTMLDivElement | object>(null)

  useEffect(() => {
    ref.current = new Miew({
      container: miewContainer?.current,
      ...props.options
    })
    if (ref.current.init()) ref.current.run()
  }, [])

  // TODO: use styled when styled configuration is merged
  return <div ref={miewContainer} style={{ width: '100%', height: '100%' }} />
})
