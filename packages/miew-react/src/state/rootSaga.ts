import { spawn } from 'redux-saga/effects'
import { watchInitApp } from 'state/common'
// import { watchStatus } from './status'

export function* rootSaga() {
  yield spawn(watchInitApp)
  // yield spawn(watchStatus)
}
