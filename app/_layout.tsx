import { SessionProvider } from "@/context";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store } from './(app)/models/store';
// Import your global CSS file
import "../global.css";

/**
 * Root Layout is the highest-level layout in the app, wrapping all other layouts and screens.
 * It provides:
 * 1. Global authentication context via SessionProvider
 * 2. Redux store via Provider
 * 3. Gesture handling support for the entire app
 * 4. Global styles and configurations
 *
 * This layout affects every screen in the app, including both authenticated
 * and unauthenticated routes.
 */
export default function Root() {
  return (
    <Provider store={store}>
      <SessionProvider>
        {/* 
          GestureHandlerRootView is required for:
          - Drawer navigation gestures
          - Swipe gestures
          - Other gesture-based interactions
          Must wrap the entire app to function properly
        */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* 
            Slot renders child routes dynamically
            This includes both (app) and (auth) group routes
          */}
          <Slot />
        </GestureHandlerRootView>
      </SessionProvider>
    </Provider>
  );
}
