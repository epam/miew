import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface StatusState {
  currentStatus: string
}

const initialState: StatusState = {
  currentStatus: ''
}

export const StatusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    UPDATE_STATUS: (state: StatusState, action: PayloadAction<string>) => {
      state.currentStatus = action.payload
    }
  }
})

export const { UPDATE_STATUS } = StatusSlice.actions

export const statusReducer = StatusSlice.reducer
