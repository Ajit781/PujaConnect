import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  cartItemId: string; // unique ID for the cart entry
  pujaId: string;
  titleEn: string;
  titleBn: string;
  exactPrice: number;
  exactPriceBn: string;
  selectedDate: string; // ISO string
  selectedTime: string;
  imagePlaceholder: string;
  color: string;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      // Avoid exact duplicates (same puja, date, time)
      const exists = state.items.find(
        i =>
          i.pujaId === action.payload.pujaId &&
          i.selectedDate === action.payload.selectedDate &&
          i.selectedTime === action.payload.selectedTime,
      );
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        item => item.cartItemId !== action.payload,
      );
    },
    clearCart: state => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
