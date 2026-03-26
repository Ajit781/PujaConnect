import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
  favorites: string[]; // array of Puja IDs
  hasUnseenItems: boolean;
}

const initialState: WishlistState = {
  favorites: [],
  hasUnseenItems: false,
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
        state.hasUnseenItems = true;
      }
    },
    setFavorites: (state, action: PayloadAction<string[]>) => {
      state.favorites = action.payload;
    },
    markWishlistAsSeen: state => {
      state.hasUnseenItems = false;
    },
  },
});

export const { toggleFavorite, setFavorites, markWishlistAsSeen } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;
