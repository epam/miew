import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface EditorState {
  isInitialized: boolean
  data: string | undefined
  error: string | undefined
}

const initialState: EditorState = {
  isInitialized: false,
  data: undefined,
  error: undefined
}

export const InitSlice = createSlice({
  name: 'init',
  initialState,
  reducers: {
    INIT: (state: EditorState) => {
      state.isInitialized = false
      state.data = undefined
      state.error = undefined
    },
    INIT_SUCCESS: (state: EditorState, action: PayloadAction<string>) => {
      state.isInitialized = true
      state.data = action.payload
      state.error = undefined
    },
    INIT_FAIL: (state: EditorState, action: PayloadAction<string>) => {
      state.isInitialized = false
      state.data = undefined
      state.error = action.payload
    }
  }
})

export const { INIT, INIT_SUCCESS, INIT_FAIL } = InitSlice.actions

export const initReducer = InitSlice.reducer
