import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderItem {
  id: string;
  titleEn: string;
  titleBn: string;
  price: number;
  pandits: number;
  duration: string;
  imagePlaceholder: string;
  color: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Rescheduled';
}

export interface Order {
  id: string;
  bookingRef: string;
  items: OrderItem[];
  totalAmount: number;
  datePlaced: string;
  status:
    | 'Booking Initiated'
    | 'Upcoming'
    | 'Completed'
    | 'Pending'
    | 'Partial Cancelled'
    | 'Cancelled'
    | 'Rescheduled';
  paymentStatus: 'PAID' | 'UNPAID';
}

interface OrderState {
  orders: Order[];
}

const initialState: OrderState = {
  orders: [],
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    placeOrder: (state, action: PayloadAction<Order>) => {
      // Add the new order at the beginning of the list
      state.orders.unshift(action.payload);
    },
    cancelOrder: (
      state,
      action: PayloadAction<{ orderId: string; reason?: string }>,
    ) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.status = 'Cancelled';
        order.items.forEach(item => {
          item.status = 'Cancelled';
        });
      }
    },
    cancelOrderItem: (
      state,
      action: PayloadAction<{
        orderId: string;
        itemId: string;
        reason?: string;
      }>,
    ) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        const item = order.items.find(i => i.id === action.payload.itemId);
        if (item) {
          item.status = 'Cancelled';

          // Check overall order status
          const allCancelled = order.items.every(i => i.status === 'Cancelled');
          const someCancelled = order.items.some(i => i.status === 'Cancelled');

          if (allCancelled) {
            order.status = 'Cancelled';
          } else if (someCancelled) {
            order.status = 'Partial Cancelled';
          }
        }
      }
    },
    rescheduleOrderItem: (
      state,
      action: PayloadAction<{
        orderId: string;
        itemId: string;
        newDate: string;
        newTime: string;
      }>,
    ) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        const item = order.items.find(i => i.id === action.payload.itemId);
        if (item) {
          item.scheduledDate = action.payload.newDate;
          item.scheduledTime = action.payload.newTime;
          item.status = 'Rescheduled';

          if (
            order.status !== 'Partial Cancelled' &&
            order.status !== 'Cancelled'
          ) {
            order.status = 'Rescheduled';
          }
        }
      }
    },
  },
});

export const { placeOrder, cancelOrder, cancelOrderItem, rescheduleOrderItem } =
  orderSlice.actions;
export default orderSlice.reducer;
