import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "redux";
import ScavengerHunt from "../(drawer)/(tabs)/ScavengerHunt";

let AsyncStorage;
try {
  //import for async storage
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (err) {
    //Fall back to web storage if async storage is not available
  AsyncStorage = require('redux-persist/lib/storage').default;
}

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['scavSlice', 'ScavengerHunt']
};

const rootReducer = combineReducers({
  scavSlice: scavSlice.reducer,
  ScavengerHunt: ScavengerHunt.reducer
});
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer
});