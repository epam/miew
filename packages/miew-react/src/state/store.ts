import createSagaMiddleware from 'redux-saga'
import { configureStore } from '@reduxjs/toolkit'
import { rootSaga } from 'state/rootSaga'
import { infoReducer } from './info'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    info: infoReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware)
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
