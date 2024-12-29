import {combineReducers, configureStore} from '@reduxjs/toolkit';
import { setupListeners }   from '@reduxjs/toolkit/query';
import { persistReducer,FLUSH,REHYDRATE,PAUSE,PERSIST,PURGE,REGISTER } from 'redux-persist';
import storage from'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
}
const rootReducer = combineReducers({
//   auth: persistReducer(persistConfig, authReducer),
});

const persitedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persitedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

setupListeners(store.dispatch);