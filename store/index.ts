import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./auth-slice";
import cartSlice from "./cart-slice";

type cart = {
    id: number;
    price: number;
    quantity : number;
    totalPrice : number;
    name : string;
}

interface  auth {isLoggedIn : boolean;}

interface Cart {
    itemsList : cart[];
    totalQuantity : number;
    showCart : boolean;
}

export interface RootState {
    auth : auth;
    cart : Cart;
}

const store = configureStore({
    reducer : {
        auth : authSlice.reducer,
        cart : cartSlice.reducer,
    },
});

export default store;