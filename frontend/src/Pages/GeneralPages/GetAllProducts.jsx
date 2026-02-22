import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart as guestAddToCart } from '@Redux/reducers/guestCartSlice';
import toast from 'react-hot-toast';

const GetAllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedInUser = useSelector((state) => state.user.currentUser?.user);
  const uid = loggedInUser?.uid;

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/product/getAllProducts', {
        params: { search, category, sort, page, limit: 50},
      });
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, [search, category, sort, page]);

  const handleAddToCart = async (productId) => {
    const product = products.find((p) => p._id === productId);
    const cartData = { productId, uid };

    try {
      if (loggedInUser) {
        await axios.post('/cart/addToCart', cartData);
        toast.success(`${product.name} added to cart`);
      } else {
        dispatch(
          guestAddToCart({
            productId,
            quantity: 1,
            productName: product.name,
            productDescription: product.description,
            productColor: product.color,
            productCategory: product.category,
            productPrice: product.price,
            productStock: product.stock,
            productimageUrl: product.imageUrl,
          })
        );
        toast.success(`${product.name} added to cart`);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setSort('');
    setPage(1);
  };

  const handleProductDetails = (id) => {
    const product = products.find(p => p._id === id);
    if (product) {
      navigate(`/product/${id}`, { state: { product } });
    } else {
      console.error("Product not found with id:", id);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ textAlign: 'center' }}></h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, description, price..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px', width: '200px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="">All Categories</option>
          <option value="Laptop">Laptop</option>
          <option value="Mobile">Mobile</option>
          <option value="Tablet">Tablet</option>
          <option value="Accessories">Accessory</option>
          <option value="Console">Console</option>
          <option value="Audio">Audio</option>
          <option value="Cameras">Cameras</option>
          <option value="Displays">Displays</option>
          <option value="Wearables">Wearables</option>
          <option value="SmartHome">SmartHome</option>
          <option value="Storage">Storage</option>
          <option value="Networking">Networking</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="">Sort By</option>
          <option value="asc">Price Low to High</option>
          <option value="desc">Price High to Low</option>
        </select>
        <button
          onClick={handleClearFilters}
          style={{
            padding: '8px 12px',
            borderRadius: '5px',
            border: '1px solid gray',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
          }}
        >
          Clear Filters
        </button>
          

      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          width: '100%',
        }}
      >
        {products.map((product) => (
          <div
            key={product._id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              maxWidth: '250px',
              height: '330px',
              margin: '10px',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                overflow: 'hidden',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <img
                onClick={() => handleProductDetails(product._id)}
                src={product.imageUrl}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div style={{ width: '100%', textAlign: 'left' }}>
              <p
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {product.name}
              </p>
              <p> ${product.price} </p>
            </div>

            <button
              onClick={() => handleAddToCart(product._id)}
              style={{
                marginTop: 'auto',
                padding: '8px 12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Add To Cart
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          style={{
            padding: '8px 12px',
            borderRadius: '5px',
            border: '1px solid gray',
            backgroundColor: '#f5f5f5',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              padding: '8px 12px',
              backgroundColor: p === page ? '#007BFF' : 'white',
              color: p === page ? 'white' : 'black',
              borderRadius: '5px',
              border: '1px solid gray',
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          style={{
            padding: '8px 12px',
            borderRadius: '5px',
            border: '1px solid gray',
            backgroundColor: '#f5f5f5',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default GetAllProducts;
