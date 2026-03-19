import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
  favorites: string[]; // array of Puja IDs
}

const initialState: WishlistState = {
  favorites: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const pujaId = action.payload;
      if (state.favorites.includes(pujaId)) {
        state.favorites = state.favorites.filter(id => id !== pujaId);
      } else {
        state.favorites.push(pujaId);
      }
    },
  },
});

export const { toggleFavorite } = wishlistSlice.actions;
export default wishlistSlice.reducer;
