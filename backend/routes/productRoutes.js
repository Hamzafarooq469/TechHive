
const express = require("express");
const { createProduct, getAllProducts, updateProduct, getAllProductsForAdmin,
deleteProduct, getProductDetails, getProductDetailsForAdmin,
ProductCategoryChart,  ProductAveragePriceChart,
ProductCreatedOverTimeChart, ProductUpdatedOverTimeChart, getProductCountPerUser,
StockPerProductChart, addComment, addRating, 
} = require("../controller/productController");
const { isAuth, hasRole } = require("../middleware/m2");
const  upload  = require("../middleware/upload")


const router = express.Router();

router.post("/create", isAuth, hasRole("admin"), upload.single("image"), createProduct);
router.get("/getAllProductsForAdmin", isAuth, hasRole("admin"), getAllProductsForAdmin);

router.get("/getAllProducts",  getAllProducts);
router.put("/updateProduct/:id", upload.single("image"), updateProduct)

router.get("/getProductDetails/:id", getProductDetails)
router.get("/getProductDetailsForAdmin/:id", isAuth, hasRole("admin"), getProductDetailsForAdmin)

router.delete("/deleteProduct/:id", isAuth, hasRole("admin"), deleteProduct);

router.get("/stats/category", ProductCategoryChart);
router.get("/stats/averagePriceCategory", ProductAveragePriceChart);
router.get('/stats/createdOverTime', ProductCreatedOverTimeChart);
router.get("/stats/updatedOverTime", ProductUpdatedOverTimeChart);
router.get("/stats/productsPerUser", getProductCountPerUser);
router.get("/stats/stockPerProduct", StockPerProductChart);

router.post("/:id/comment", isAuth, addComment);
router.post("/:id/rate", isAuth,  addRating);


module.exports = router;






