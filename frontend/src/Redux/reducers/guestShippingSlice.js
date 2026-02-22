
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    shipping: null,
}

const guestShippingSlice = createSlice({
    name: "shipping",
    initialState,
    reducers: {
        addToShipping: (state, action) => {
            const {
                fullName, address, city, postalCode, phoneNumber, country
            } = action.payload;

            // Update shipping state with the new shipping details
            state.shipping = {
                fullName,
                address,
                city,
                postalCode,
                phoneNumber,
                country,
            };
        },
        clearShipping: (state) => {
            state.shipping = null
        }
    }
})

export const { addToShipping, clearShipping } = guestShippingSlice.actions;

export default guestShippingSlice.reducer;
