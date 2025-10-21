import {createSlice} from "@reduxjs/toolkit";

const scavSlice = createSlice({
  name: "scavengerHunt",
  initialState: {
    items: [],
  },
  reducers: {
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload.id);
    },
  },
});

export const { addItem, removeItem } = scavSlice.actions;
export default scavSlice.reducer;
