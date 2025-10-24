import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  huntData: [],
  totalItems: 0,
  completedItems: 0
};

const ScavengerHuntSlice = createSlice({
  name: 'ScavengerHunt',
  initialState,
  reducers: {
    setHuntData: (state, action) => {
      state.huntData = action.payload;
      state.totalItems = action.payload.length;
    },
    updateItemCompletion: (state, action) => {
      const { id, completed } = action.payload;
      const item = state.huntData.find(item => item.id === id);
      if (item) {
        item.completed = completed;
        state.completedItems = state.huntData.filter(item => item.completed).length;
      }
    },
    addHuntItem: (state, action) => {
      state.huntData.push(action.payload);
      state.totalItems = state.huntData.length;
    },
    removeHuntItem: (state, action) => {
      state.huntData = state.huntData.filter(item => item.id !== action.payload);
      state.totalItems = state.huntData.length;
      state.completedItems = state.huntData.filter(item => item.completed).length;
    }
  }
});

export const {
  setHuntData,
  updateItemCompletion,
  addHuntItem,
  removeHuntItem
} = ScavengerHuntSlice.actions;

export default ScavengerHuntSlice.reducer;