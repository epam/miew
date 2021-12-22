import { put, call, takeEvery } from 'redux-saga/effects'
import { INIT, INIT_SUCCESS, INIT_FAIL } from '.'

const fetchInitData = (url: string) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(`data fetched from ${url}`), 2000)
  )
const TEST_URL = 'some/url'

function* initApp() {
  try {
    const data = yield call(fetchInitData, TEST_URL)
    yield put(INIT_SUCCESS(data))
  } catch (error) {
    yield put(INIT_FAIL('SAMPLE ERROR'))
  }
}

export function* watchInitApp() {
  yield takeEvery(INIT, initApp)
}
