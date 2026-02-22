
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; 
import userReducer from './reducers/userSlice'; 
import guestCartReducer from './reducers/guestCartSlice'; 
import guestShippingReducer from './reducers/guestShippingSlice'; // Import your guest shipping slice
import guestOrderReducer from './reducers/guestOrderSlice'; // Import the guest order slice
import orderIdReducer from "./reducers/orderIdSlice";

// Define the persist config for user state, cart, shipping, and orders
const persistConfig = {
    key: 'root', 
    storage, 
};

// Combine reducers
const rootReducer = combineReducers({
    user: userReducer,
    guestCart: guestCartReducer,
    guestShipping: guestShippingReducer,
    guestOrder: guestOrderReducer, // Add the guestOrder reducer
    orderId: orderIdReducer,
    // guestShipping: guestShippingReducer, // Add the guestShipping reducer
});

// Apply persistReducer to the combined reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the Redux store
const store = configureStore({
    reducer: persistedReducer, 
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'persist/PERSIST',
                    'persist/REHYDRATE',
                    'persist/FLUSH',
                    'persist/PAUSE',
                    'persist/PURGE',
                    'persist/REMOVE',
                ],
            },
        }),
});

const persistor = persistStore(store); 

export { store, persistor }; 
// export default store;
