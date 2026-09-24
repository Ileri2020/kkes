// Use: node scripts/test-db-handler.js
const axios = require('axios');

async function testCarts() {
    try {
        const res = await axios.get('http://localhost:3000/api/dbhandler?model=cart&limit=1');
        console.log('Cart Record Fetched:');
        const cart = res.data[0];
        console.log('ID:', cart.id);
        console.log('Products Count:', cart.products?.length);
        if (cart.products?.length > 0) {
            console.log('First Product Name:', cart.products[0].product?.name || cart.products[0].customName);
        }
    } catch (err) {
        console.error('API Test Failed (Make sure dev server is running!):', err.message);
    }
}

testCarts();
