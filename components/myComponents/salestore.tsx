// components/ECommerceSalesPage.js

import { Button } from "../ui/button";

const products = [
  {
    id: 1,
    image: 'https://via.placeholder.com/250x250',
    title: 'Product 1',
    price: '$19.99',
  },
  {
    id: 2,
    image: 'https://via.placeholder.com/250x250',
    title: 'Product 2',
    price: '$29.99',
  },
  // Add more products as needed
];

const ECommerceSalesPage = () => {
  return (
    <div className="bg-white">
      {/* Fixed Cart Icon */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-primary text-white rounded-full p-2 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="ml-2 text-sm">2</span>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-primary text-center mb-8">Our Products</h1>
        <div className="grid gap-6 md:grid-cols-4 tablet:grid-cols-3 mobile:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-32 md:h-48 object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-bold text-center mb-2">{product.title}</h2>
                <p className="text-accent text-xl font-semibold text-center mb-4">{product.price}</p>
                <div className="flex justify-center space-x-4">
                  <Button variant="secondary" className="px-4 py-2">
                    View Details
                  </Button>
                  <Button variant="secondary" className="px-4 py-2">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ECommerceSalesPage;