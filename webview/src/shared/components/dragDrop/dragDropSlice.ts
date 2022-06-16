import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DragDropContextValue } from './DragDropContext'
import { clearData } from '../../actions'
import { ReducerName } from '../../constants'

export interface DragDropState extends DragDropContextValue {}

export const dragDropInitialState: DragDropState = {
  draggedRef: undefined,
  groupStates: undefined,
  removeGroupState: undefined,
  setDraggedRef: undefined,
  setGroupState: undefined
}

export const dragDropSlice = createSlice({
  extraReducers: builder => {
    builder
      .addCase(clearData, (_, action) => {
        if (!action.payload || action.payload === ReducerName.dragDrop) {
          return { ...dragDropInitialState }
        }
      })
      .addDefaultCase(() => {})
  },
  initialState: dragDropInitialState,
  name: ReducerName.comparison,
  reducers: {
    changeSize: (state, action: PayloadAction<PlotSize>) => {
      state.size = action.payload
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload
    },
    update: (state, action: PayloadAction<PlotsComparisonData>) => {
      Object.assign(state, action.payload)
      state.hasData = !!action.payload
    }
  }
})

export const { update, setCollapsed, changeSize } = comparisonTableSlice.actions

export default comparisonTableSlice.reducer
