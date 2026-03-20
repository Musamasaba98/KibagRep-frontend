import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import uiSlice from "./uiStateSlice.js";
import authSlice from "./authSlice";
import offlineQueueReducer from "./offlineQueueSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "uiState", "offlineQueue"],
};

const rootReducer = combineReducers({
  uiState: uiSlice.reducer,
  auth: authSlice.reducer,
  offlineQueue: offlineQueueReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
