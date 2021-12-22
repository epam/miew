import { useEffect } from 'react'
import { useAppDispatch, useAppSelector, RootState } from 'state'
import { INIT, INIT_FAIL } from 'state/common'

export const App = () => {
  const isInitialized = useAppSelector(
    (state: RootState) => state.init.isInitialized
  )
  const data = useAppSelector((state: RootState) => state.init?.data)
  const error = useAppSelector((state: RootState) => state.init?.error)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(INIT())
  }, [])

  return (
    <>
      <p>HELLO, I am Miew!</p>
      {error && <p>Failed to initialize App, Error: {error}</p>}
      {!isInitialized && !error && <p>App is not initialized</p>}
      {isInitialized && <p>App is initialized, data recieved: {data}</p>}
      <button onClick={() => dispatch(INIT())}>Re-initialize app</button>
      <button onClick={() => dispatch(INIT_FAIL('ERROR'))}>
        Simulate error
      </button>
    </>
  )
}
