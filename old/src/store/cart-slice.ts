import { createSlice } from "@reduxjs/toolkit";

type cart = {
    id: number;
    price: number;
    quantity : number;
    totalPrice : number;
    name : string;
}

let itemslist : cart[] = [];


const cartSlice = createSlice({
    name : "cart",
    initialState : {
        itemsList : itemslist,
        totalQuantity : 0,
        showCart : false
    },
    reducers : {
        addToCart(state, action) {
            const newItem = action.payload;
            //check if any item is already available
            const existingItem = state.itemsList.find((item)=>item.id === newItem.id);
            if (existingItem){
                existingItem.quantity++;
                existingItem.totalPrice += newItem.price;
            } else {
                state.itemsList.push({
                    id: newItem.id,
                    price: newItem.price,
                    quantity : 1,
                    totalPrice : newItem.price,
                    name : newItem.name
                })
            }
        },
        removeFromCart() {},
        setShowCart(state) {
            state.showCart = true;
        }
    }
})



export const cartActions = cartSlice.actions;

export default cartSlice;