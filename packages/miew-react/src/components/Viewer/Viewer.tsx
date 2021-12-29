import { useEffect, useRef } from 'react'
// @ts-ignore
// import Miew from 'miew'

export const Viewer = ({ Miew }) => {
  const miewContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!miewContainer.current) return
    const Viewer = new Miew({
      container: miewContainer.current,
      load: '2FD7',
      reps: [
        {
          mode: 'BS'
        }
      ],
      settings: {
        autoPreset: false,
        bg: { color: 0x202020 },
        editing: true,
        inversePanning: true
      }
    })

    if (Viewer.init()) {
      Viewer.run()
    }
  }, [])

  return <div ref={miewContainer}></div>
}
