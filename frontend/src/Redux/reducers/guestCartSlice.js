
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cart: [],
};

const guestCartSlice = createSlice({
    name: "guestCart",
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const {
                productId, 
                quantity, 
                productName, 
                productDescription, 
                productCategory, 
                productPrice, 
                productStock,
                productimageUrl
            } = action.payload
            
            const existingItem = state.cart.find(item => item.productId === productId);
                        if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                state.cart.push({ 
                    productId, 
                    quantity, 
                    productName, 
                    productDescription, 
                    productCategory, 
                    productPrice, 
                    productStock,
                    productimageUrl
                });
            }
        },

        removeItemFromCart: (state, action) => {
            state.cart = state.cart.filter(item => item.productId !== action.payload);
        },

        clearCart: (state) => {
            state.cart = []
        }
    },
});

export const { addToCart, removeItemFromCart, clearCart } = guestCartSlice.actions;
export default guestCartSlice.reducer;