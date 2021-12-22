import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface EditorState {
  isInitialized: boolean
  data?: string
  error?: string
}

const initialState: EditorState = {
  isInitialized: false
}

export const InitSlice = createSlice({
  name: 'init',
  initialState,
  reducers: {
    INIT: (state) => {
      state.isInitialized = false
    },
    INIT_SUCCESS: (state, action: PayloadAction<string>) => {
      state.isInitialized = true
      state.data = action.payload
      delete state.error
    },
    INIT_FAIL: (state, action: PayloadAction<string>) => {
      state.isInitialized = false
      state.error = action.payload
      delete state.data
    }
  }
})

export const { INIT, INIT_SUCCESS, INIT_FAIL } = InitSlice.actions

export const initReducer = InitSlice.reducer
