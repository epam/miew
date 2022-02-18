import { spawn } from 'redux-saga/effects'
import { watchInitApp } from 'state/common'

export function* rootSaga() {
  yield spawn(watchInitApp)
}
