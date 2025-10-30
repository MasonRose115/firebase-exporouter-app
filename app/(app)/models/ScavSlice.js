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
      const providedId = action.payload?.id;
      state.items.push({
        id: providedId || Date.now().toString(),
        name: action.payload.name,
        description: action.payload.description || '',
        found: false,
        started: false,
        location: action.payload.location || null
      });
    },
    removeItem: (state, action) => {
      const target = String(action.payload);
      state.items = state.items.filter(item => String(item.id) !== target);
      state.totalFound = state.items.filter(item => item.found).length;
    },
    removeItemsBulk: (state, action) => {
      const targets = new Set((action.payload || []).map((id) => String(id)));
      if (targets.size === 0) return;
      state.items = state.items.filter(item => !targets.has(String(item.id)));
      state.totalFound = state.items.filter(item => item.found).length;
    },
    toggleItemFound: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.found = !item.found;
        state.totalFound = state.items.filter(item => item.found).length;
      }
    },
    updateItemName: (state, action) => {
      const { id, name } = action.payload || {};
      const item = state.items.find(item => String(item.id) === String(id));
      if (item && typeof name === 'string') {
        item.name = name;
      }
    },
    startHunt: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.started = true;
      }
    },
    endHunt: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.started = false;
      }
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
  removeItemsBulk,
  toggleItemFound, 
  updateItemName,
  startHunt, 
  endHunt, 
  resetHunt 
} = scavSlice.actions;
export default scavSlice.reducer;
