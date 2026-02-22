
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../../Services/Firebase';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { getAdminToken } from '../../Utils/getAuthToken';
import toast from 'react-hot-toast';

const GetAllProductsForAdmin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.user.currentUser);

  const getToken = async () => {
    if (currentUser?.user?.token) {
      return currentUser.user.token;
    } else if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    } else {
      throw new Error("User not authenticated");
    }
  };

  const fetchAllProducts = async () => {
    try {
      const idToken = await getAdminToken();
      // const idToken = await getToken();

      const response = await axios.get('/product/getAllProductsForAdmin', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      setProducts(response.data);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (e, productId) => {
    e.stopPropagation(); // Prevent triggering parent onClick
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const idToken = await getToken();

      const result = await axios.delete(`/product/deleteProduct/${productId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      setProducts(products.filter((product) => product._id !== productId));
      alert('Product deleted successfully');
      if (result.data.cache) {
        toast.info(result.data.cache); // "Cache invalidated"
  }


    } catch (error) {
      setError('Error deleting product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateProduct = (e, productId) => {
    e.stopPropagation(); // Prevent triggering parent onClick
    navigate(`/admin/updateProduct/${productId}`);
  };

  useEffect(() => {
    fetchAllProducts();
  }, [currentUser]);

  return (
    <div>
      <h1>Get All Products - For Admin</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {products && products.length > 0 ? (
        products.map((product) => (
          <div
            key={product._id}
            onClick={() => navigate(`/admin/getProductDetailsForAdmin/${product._id}`)}
            style={{ border: '1px solid gray', margin: '10px', padding: '10px', cursor: 'pointer' }}
          >
            <p><strong>Name:</strong> {product.name}</p>
            <p><strong>Description:</strong> {product.description}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Stock:</strong> {product.stock}</p>
            <p><strong>Created By:</strong> {product.createdBy}</p>
            <p><strong>Created At:</strong> {new Date(product.createdAt).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(product.updatedAt).toLocaleString()}</p>
            <img src={product.imageUrl} alt={product.name} style={{ width: '200px', height: 'auto' }} />

            {/* Buttons outside the onClick zone */}
            <div style={{ marginTop: '10px' }}>
              <button onClick={(e) => handleUpdateProduct(e, product._id)}>Update</button>
              <button onClick={(e) => handleDeleteProduct(e, product._id)}>Delete</button>
            </div>
          </div>
        ))
      ) : (
        <p>No products available.</p>
      )}
    </div>
  );
};

export default GetAllProductsForAdmin;
