import { SessionProvider } from "@/context";
import { QuickActionsHandler } from "@/components/QuickActionsHandler";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './(app)/models/store';
// Import your global CSS file
import "../global.css";

/**
 * Root Layout is the highest-level layout in the app, wrapping all other layouts and screens.
 * It provides:
 * 1. Quick actions handling via QuickActionsHandler
 * 2. Global authentication context via SessionProvider
 * 3. Redux store via Provider
 * 4. Gesture handling support for the entire app
 * 5. Global styles and configurations
 *
 * This layout affects every screen in the app, including both authenticated
 * and unauthenticated routes.
 */
export default function Root() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <SessionProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <QuickActionsHandler />
            <Slot />
          </GestureHandlerRootView>
        </SessionProvider>
      </PersistGate>
    </Provider>
  );
}
