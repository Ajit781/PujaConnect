import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Address {
  id: string;
  type: string; // e.g., 'Home', 'Office', 'Temple'
  label: string;
  contactName: string;
  contactNumber: string;
  relationType: string;
  addressLine1: string;
  streetArea: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
}

interface AddressState {
  addresses: Address[];
}

const initialState: AddressState = {
  addresses: [],
};

export const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    addAddress: (state, action: PayloadAction<Address>) => {
      // If this is the first address or it's set as default, unset other defaults
      if (state.addresses.length === 0 || action.payload.isDefault) {
        state.addresses.forEach(addr => {
          addr.isDefault = false;
        });
        action.payload.isDefault = true;
      }
      state.addresses.push(action.payload);
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      if (action.payload.isDefault) {
        state.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      const index = state.addresses.findIndex(
        addr => addr.id === action.payload.id,
      );
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(
        addr => addr.id !== action.payload,
      );
      // If deleted was default and there are remaining addresses, make the first one default
      if (
        state.addresses.length > 0 &&
        !state.addresses.some(addr => addr.isDefault)
      ) {
        state.addresses[0].isDefault = true;
      }
    },
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.addresses.forEach(addr => {
        addr.isDefault = addr.id === action.payload;
      });
    },
  },
});

export const { addAddress, updateAddress, deleteAddress, setDefaultAddress } =
  addressSlice.actions;
export default addressSlice.reducer;
