import { put, takeEvery } from 'redux-saga/effects'
import { UPDATE_STATUS } from './statusSlice'

function* updateStatus(status) {
  yield put(UPDATE_STATUS(status))
}

export function* watchStatus() {
  yield takeEvery(UPDATE_STATUS, updateStatus)
}
