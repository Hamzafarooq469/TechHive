
    const express = require("express");
    const { addToCart, getCart, decreaseQuantity, increaseQuantity, removeItem, clearCart } = require("../controller/cartController");

    const router = express.Router();

    router.post("/addToCart", addToCart);
    router.get("/getCart", getCart);
    router.post("/decreaseQuantity", decreaseQuantity);
    router.post("/increaseQuantity", increaseQuantity);
    router.post("/removeItem", removeItem);
    router.delete("/clearCart/:uid", clearCart);


    module.exports = router;