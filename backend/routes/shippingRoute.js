
const express = require("express")
const { addShipping, getAllShipping, getShippingStatsByCity } = require("../controller/shippingController")
const router = express.Router()

router.post("/addShipping", addShipping)
router.get("/getAllShipping/:id", getAllShipping)

router.get("/stats/city", getShippingStatsByCity);

module.exports = router