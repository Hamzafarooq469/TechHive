
const express = require("express")
const { createOrder, getAllOrdersForAdmin, updateOrderStatus,  createOrderByGuest, orderSummary, trackOrder, OrderByCityChart, 
OrdersOverTimeChart, getGuestVsRegisteredStats, TopCustomerChart, RevenueByCityChart, RevenueByPeriodChart } = require("../controller/orderController")
const { isAuth, hasRole } = require("../middleware/m2");
const router = express.Router()

router.post("/createOrder", createOrder)

router.post("/createOrder/guest", createOrderByGuest)

router.get("/getAllOrdersForAdmin", isAuth, hasRole("admin"),  getAllOrdersForAdmin)

router.post("/updateOrderStatus", updateOrderStatus)

router.get("/orderSummary/:id", orderSummary)

router.get("/trackOrder/:trackingNumber", trackOrder)

router.get("/stats/ordersByCity", OrderByCityChart)

router.get("/stats/ordersOverTime", OrdersOverTimeChart)

router.get("/stats/guestVsRegistered", getGuestVsRegisteredStats);

router.get("/stats/topCustomers", TopCustomerChart);

router.get("/stats/revenueByCity", RevenueByCityChart);

router.get("/stats/revenueByPeriod", RevenueByPeriodChart);


module.exports = router