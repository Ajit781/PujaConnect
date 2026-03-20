import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import wishlistReducer from './slices/wishlistSlice';
import cartReducer from './slices/cartSlice';
import loaderReducer from './slices/loaderSlice';
import addressReducer from './slices/addressSlice';
import orderReducer from './slices/orderSlice';
import { pujaApi } from './api/pujaApi';

// Persist config defining what to store and the storage engine
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'wishlist', 'cart', 'address', 'order'], // Persist auth, wishlist, cart, addresses, and orders
};

const rootReducer = combineReducers({
  auth: authReducer,
  wishlist: wishlistReducer,
  cart: cartReducer,
  loader: loaderReducer,
  address: addressReducer,
  order: orderReducer,
  [pujaApi.reducerPath]: pujaApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions for serializability checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(pujaApi.middleware),
});

export const persistor = persistStore(store);

// Infer RootState and AppDispatch types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
