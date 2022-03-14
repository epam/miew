import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface InfoState {
  status: string
  moleculeInfo: string
}

const initialState: InfoState = {
  status: '',
  moleculeInfo: ''
}

export const InfoSlice = createSlice({
  name: 'info',
  initialState,
  reducers: {
    UPDATE_STATUS: (state: InfoState, action: PayloadAction<string>) => {
      state.status = action.payload
    },
    UPDATE_MOLECULE_INFO: (state: InfoState, action: PayloadAction<string>) => {
      state.moleculeInfo = action.payload
    }
  }
})

export const { UPDATE_STATUS, UPDATE_MOLECULE_INFO } = InfoSlice.actions

export const infoReducer = InfoSlice.reducer
