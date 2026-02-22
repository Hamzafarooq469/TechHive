
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    order: null, // Initially no order
    shipping: null, // To store shipping details
    cart: [], // To store cart items
};

const guestOrderSlice = createSlice({
    name: "order",
    initialState,
    reducers: {
        addToOrder: (state, action) => {
            const { cartItems, shippingDetails, id } = action.payload;

            // Update state with cart items and shipping details
            state.cart = cartItems; // Update cart with provided items
            state.shipping = shippingDetails; // Update shipping details
            state.user = id; // Update user ID

            // Set the order as a single object
            state.order = { cartItems, shippingDetails, id };
        },
        clearOrder: (state) => {
            // Reset the order and related state
            state.order = null; // Clear the single order
            state.shipping = null; // Reset shipping
            state.cart = []; // Clear cart
        },
        cleartOrder: (state) => {
            state.order = null
        }
    }
});

// Export actions and reducer
export const { addToOrder, clearOrder } = guestOrderSlice.actions;
export default guestOrderSlice.reducer;
