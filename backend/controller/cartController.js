
const Product = require("../models/productModel")
const Cart = require("../models/cartModel");
const User = require("../models/userModel");

const addToCart = async (req, res) => {
  const { productId, uid } = req.body;
  if (!productId || !uid) {
    return res.status(400).json({ message: "Please add all the fields" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: uid });

    if (!cart) {
      cart = new Cart({
        user: uid,
        items: [{ 
            product: product._id, 
            quantity: 1 
        }]
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === product._id.toString());

      if (itemIndex > -1) {
        // Product exists in cart, increment quantity
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ product: product._id, quantity: 1 });
      }
    }

    await cart.save();
    return res.status(200).json({ cart });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getCart = async (req, res) => {
  const { uid } = req.query; 
  console.log(req.query)
  try {
    const cart = await Cart.findOne({ user: uid }).populate('items.product');
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    return res.status(200).json(cart);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const decreaseQuantity = async (req, res) => {
  const { id } = req.body;

  try {
    const cart = await Cart.findOne({ 'items._id': id }).populate('items.product');
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart.items.pull(id); 
}

    await cart.save();
    res.status(200).json({ message: "Quantity decreased", cart });
  } catch (error) {
    console.error("Error decreasing quantity:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


const increaseQuantity = async (req, res) => {
  const { id } = req.body; 
  console.log("CART ID", id)
  try {
    const cart = await Cart.findOne({ 'items._id': id }).populate('items.product');
    console.log("CART", cart)
    // console.log("Cart found:", cart);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const product = item.product;

    if (item.quantity >= product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} items in stock` });
    } else {
        item.quantity += 1;
    }

    await cart.save();
    res.status(200).json({ message: "Quantity increased", cart });
  } catch (error) {
    console.error("Error increasing quantity:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const removeItem = async (req, res) => {
  const { id } = req.body;

  try {
    const cart = await Cart.findOne({ 'items._id': id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items.pull(id); 
    await cart.save();

    return res.status(200).json({ message: "Item removed", cart });
  } catch (error) {
    console.error("Error removing item:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// const clearCart = async (req, res) => {
//   const { uid } = req.params;
//   try {
//     await Cart.deleteMany({ user: uid });
//     res.status(200).json({ message: "Cart cleared" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to clear cart" });
//   }
// }

const clearCart = async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const result = await Cart.deleteMany({ user: uid });

    res.status(200).json({ 
      message: "Cart cleared successfully", 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("Error clearing cart for user:", uid, error.message);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};


module.exports = {
    addToCart,
    getCart,
    decreaseQuantity,
    increaseQuantity,
    removeItem,
    clearCart
}