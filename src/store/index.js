import { persistReducer, persistStore } from "redux-persist";
import { configureStore } from "@reduxjs/toolkit";

import combineReducer from "./combineReducer";
import storage from "./storage";

const persistConfig = {
  key: "root",
  storage: storage,
  whitelist: ["authReducer", "commonReducer"],
};

const persistedReducer = persistReducer(persistConfig, combineReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export default store;
