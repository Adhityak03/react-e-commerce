import ProductCard from "./ProductCard";

export default function ProductList({ products, loading, error }) {
  if (loading) {
    return (
      <p className="text-center text-lg text-gray-600">
        Loading products...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-600 font-semibold">
        {error}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
