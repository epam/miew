import createSagaMiddleware from 'redux-saga'
import { configureStore } from '@reduxjs/toolkit'
import { rootSaga } from 'state/rootSaga'
import { initReducer } from 'state/common'
import { statusReducer } from './status'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    init: initReducer,
    status: statusReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware)
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
