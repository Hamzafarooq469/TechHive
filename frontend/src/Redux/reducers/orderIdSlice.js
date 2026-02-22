
// src/redux/orderSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderId: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrderId(state, action) {
      state.orderId = action.payload;
    },
    clearOrderId(state) {
      state.orderId = null;
    },
  },
});

export const { setOrderId, clearOrderId } = orderSlice.actions;
export default orderSlice.reducer;
