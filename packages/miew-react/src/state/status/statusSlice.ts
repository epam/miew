import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface StatusState {
  status: string
  title: string
}

const initialState: StatusState = {
  status: '',
  title: ''
}

export const StatusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    UPDATE_STATUS: (state: StatusState, action: PayloadAction<string>) => {
      state.status = action.payload
    },
    UPDATE_TITLE: (state: StatusState, action: PayloadAction<string>) => {
      state.title = action.payload
    }
  }
})

export const { UPDATE_STATUS, UPDATE_TITLE } = StatusSlice.actions

export const statusReducer = StatusSlice.reducer
