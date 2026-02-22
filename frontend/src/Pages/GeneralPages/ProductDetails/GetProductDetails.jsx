import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import ProductDetails from './ProductDetails';
import ProductComments from './ProductComments';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart as guestAddToCart } from '../../../Redux/reducers/guestCartSlice';

import toast from 'react-hot-toast';

const GetProductDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const passedProduct = location.state?.product || null;

  const [product, setProduct] = useState(passedProduct);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const loggedInUser = useSelector((state) => state.user.currentUser?.user); // change if your state shape differs
  const uid = loggedInUser?.uid;

  const handleAddToCart = async (product) => {
    const cartData = { productId: product._id, uid };
    console.log("Cart data",cartData)

    try {
      if (loggedInUser) {
        const res = await axios.post('/cart/addToCart', cartData);
        console.log("Working")
        toast.success(`${product.name} added to cart`);
      } else {
        dispatch(
          guestAddToCart({
            productId: product._id,
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
      toast.error("Failed to add to cart");
    }
  };

  useEffect(() => {
    const fetchProductIfNeeded = async () => {
      if (!product) {
        try {
          const res = await axios.get(`/product/getProductDetails/${id}`);
          setProduct(res.data);
        } catch (err) {
          setError("Failed to fetch product details.");
        }
      }
    };

    fetchProductIfNeeded();
  }, [id, product]);

  return (
    <div>
      {error && <p>{error}</p>}
      {product ? (
        <>
          <ProductDetails product={product} onAddToCart={handleAddToCart} />
          <ProductComments productId={id} />
        </>
      ) : (
        <p>Loading product...</p>
      )}
    </div>
  );
};

export default GetProductDetails;
