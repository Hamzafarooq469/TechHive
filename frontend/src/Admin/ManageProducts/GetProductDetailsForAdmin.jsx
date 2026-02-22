import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';
import { auth } from '../../Services/Firebase';
import { useSelector } from 'react-redux';



const GetProductDetailsForAdmin = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  const currentUser = useSelector((state) => state.user.currentUser);

    const getToken = async () => {
      if (currentUser?.user?.token) {
        // Token is available in Redux
        return currentUser.user.token;
      } else {
        // Token is not available, fetch a fresh token
        const freshToken = await auth.currentUser?.getIdToken();
        return freshToken;
      }
    };


  useEffect(() => {
    const handleGetProductDetails = async () => {
      try {
        const idToken = await getToken(currentUser);

        const res = await axios.get(
          `/product/getProductDetailsForAdmin/${id}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        setProduct(res.data);
      } catch (err) {
        console.error("Error fetching product:", err.message);
        setError("Failed to fetch product details.");
      }
    };

    handleGetProductDetails();
  }, [id]);

  return (
    <>
      <h1>Product Details - (Admin)</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {product ? (
        <div style={{ border: "1px solid gray", padding: "10px", margin: "10px" }}>
          <p><strong>Name:</strong> {product.name}</p>
          <p><strong>Description:</strong> {product.description}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Price:</strong> ${product.price}</p>
          <p><strong>Stock:</strong> {product.stock}</p>
          <p><strong>Created At:</strong> {new Date(product.createdAt).toLocaleString()}</p>
          <p><strong>Updated At:</strong> {new Date(product.updatedAt).toLocaleString()}</p>
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: "200px", height: "auto" }}
            />
          )}
        </div>
      ) : (
        !error && <p>Loading...</p>
      )}
    </>
  );
};

export default GetProductDetailsForAdmin;
