import {createSlice} from "@reduxjs/toolkit";

const scavSlice = createSlice({
  name: "scavengerHunt",
  initialState: {
    items: [],
    totalFound: 0,
    isHuntActive: false
  },
  reducers: {
    addItem: (state, action) => {
      state.items.push({
        id: Date.now().toString(),
        name: action.payload.name,
        description: action.payload.description || '',
        found: false,
        location: action.payload.location || null
      });
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalFound = state.items.filter(item => item.found).length;
    },
    toggleItemFound: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.found = !item.found;
        state.totalFound = state.items.filter(item => item.found).length;
      }
    },
    startHunt: (state) => {
      state.isHuntActive = true;
    },
    endHunt: (state) => {
      state.isHuntActive = false;
    },
    resetHunt: (state) => {
      state.items = state.items.map(item => ({...item, found: false}));
      state.totalFound = 0;
    }
  },
});

export const { 
  addItem, 
  removeItem, 
  toggleItemFound, 
  startHunt, 
  endHunt, 
  resetHunt 
} = scavSlice.actions;
export default scavSlice.reducer;
