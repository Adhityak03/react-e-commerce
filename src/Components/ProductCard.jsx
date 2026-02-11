export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition duration-300 p-4 flex flex-col">
      <img
        src={product.image}
        alt={product.title}
        className="h-40 object-contain mb-4"
      />

      <h2 className="text-sm font-semibold mb-2 line-clamp-2">
        {product.title}
      </h2>

      <p className="text-gray-500 text-xs mb-2 capitalize">
        {product.category}
      </p>

      <p className="text-lg font-bold text-blue-600 mt-auto">
        ${product.price}
      </p>
    </div>
  );
}
