const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Shipping = require("../models/shippingModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const { v4: uuidv4 } = require("uuid");
const Counter = require("../models/counterModel");
const Coupon = require("../models/couponModel");
const addEmailJob = require("../queue/producer/addEmailjob");
const generateOrderConfirmationEmail = require("../templates/orderConfirmationTemplate");



const getNextOrderNumber = async() => {
  const counter = await Counter.findOneAndUpdate(
    { id: "order" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true } 
  );

  return counter.seq;
}

// const createOrder = async (req, res) => {
//   const { userId: uid, shippingId: shId, cartId, couponCode } = req.body;

//   try {
//     if (!uid || !shId || !cartId) {
//       return res.status(400).json({ message: "Missing uid, shippingId, or cartId" });
//     }

//     const cart = await Cart.findById(cartId).populate('items.product');
//     if (!cart) {
//       return res.status(404).json({ message: "Cart not found" });
//     }

//     const shipping = await Shipping.findById(shId);
//     if (!shipping) {
//       return res.status(404).json({ message: "Shipping info not found" });
//     }

//     const totalAmount = cart.items.reduce((sum, item) => {
//       return sum + (item.product.price * item.quantity);
//     }, 0);

//     const newOrderNumber = await getNextOrderNumber();

//     const orderItems = cart.items.map(item => ({
//       productId: item.product._id,
//       name: item.product.name,
//       image: item.product.image,  
//       price: item.product.price,
//       quantity: item.quantity
// }));

//     const newOrder = new Order({
//       user: uid,
//       cart: cartId,
//       shipping: shId,
//       totalAmount,   
//       trackingNumber: 'TH-' + uuidv4().slice(0,8).toUpperCase(),
//       orderNumber: newOrderNumber,
//       orderItems
//     });

//     const savedOrder = await newOrder.save();

//     res.status(201).json({
//       message: "Order created successfully",
//       order: savedOrder
//     });
//   } catch (error) {
//     console.error("Order creation failed:", error.message);
//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };

const createOrder = async (req, res) => {
   const { userId: uid, shippingId: shId, cartId, couponCode } = req.body; // ✅ Added couponCode

  try {
    if (!uid || !shId || !cartId) {
      return res.status(400).json({ message: "Missing uid, shippingId, or cartId" });
    }

    const cart = await Cart.findById(cartId).populate('items.product');
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const shipping = await Shipping.findById(shId);
    if (!shipping) {
      return res.status(404).json({ message: "Shipping info not found" });
    }

    let totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    // ------------------------------------------------------------------
    //  COUPON INTEGRATION
    // ------------------------------------------------------------------
    let finalTotal = totalAmount;
    let cashbackAmount = 0;
    let couponUsedCount = 0;

    if (couponCode) {
        const couponResult = await applyCouponAndGetDiscount(couponCode, uid, totalAmount);
        finalTotal = couponResult.finalTotal;
        cashbackAmount = couponResult.cashback;
        couponUsedCount = couponResult.couponUsedCount;

        // Optionally send discount feedback
        if (couponResult.totalDiscount > 0) {
            console.log(`Applied discount: ${couponResult.totalDiscount}`);
        }
    }
    // ------------------------------------------------------------------

    const newOrderNumber = await getNextOrderNumber();

    const orderItems = cart.items.map(item => ({
      productId: item.product._id,
      name: item.product.name,
      image: item.product.image,  
      price: item.product.price,
      quantity: item.quantity
    }));

    const newOrder = new Order({
      user: uid,
      cart: cartId,
      shipping: shId,
      totalAmount: finalTotal, // ✅ Use discounted amount
      trackingNumber: 'TH-' + uuidv4().slice(0,8).toUpperCase(),
      orderNumber: newOrderNumber,
      orderItems,
      // ✅ NEW FIELDS SAVED
      couponCode: couponCode || null,
      cashbackAmount: cashbackAmount,
      couponUsed: couponUsedCount,
    });

    const savedOrder = await newOrder.save();

    // Send order confirmation email
    try {
      const user = await User.findOne({ uid });
      if (user && user.email) {
        const { html, text } = generateOrderConfirmationEmail({
          userName: user.name,
          orderNumber: savedOrder.orderNumber,
          trackingNumber: savedOrder.trackingNumber,
          orderDate: new Date(savedOrder.createdAt).toLocaleDateString(),
          orderItems: orderItems,
          couponCode: couponCode,
          cashbackAmount: cashbackAmount,
          totalAmount: finalTotal,
          shipping: shipping
        });

        await addEmailJob({
          to: user.email,
          subject: `Order Confirmed - #${savedOrder.orderNumber}`,
          html: html,
          text: text,
          jobType: 'order',
          queue: 'emailQueue'
        });

        console.log(`✅ Order confirmation email queued for ${user.email}`);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send order confirmation email:', emailError.message);
    }

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder
    });
  } catch (error) {
    console.error("Order creation failed:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


const getAllOrdersForAdmin = async (req, res) => {
  try {
    const {
      status,
      city,
      year,
      month,
      minPrice = req.query.priceMin,
      maxPrice = req.query.priceMax,
      search,
      sortBy = req.query.priceSort === 'asc' ? 'priceAsc' :
              req.query.priceSort === 'desc' ? 'priceDesc' :
              'dateDesc',
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (city && city !== 'All') {
      filter['shipping.city'] = city;
    }

    let start, end;
    if (month) {
      const m = parseInt(month) - 1;
      const y = parseInt(year) || new Date().getFullYear();
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 1);
      filter.createdAt = { $gte: start, $lt: end };
    } else if (year) {
      const y = parseInt(year);
      start = new Date(y, 0, 1);
      end = new Date(y + 1, 0, 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    if (minPrice || maxPrice) {
      filter.totalAmount = {};
      if (minPrice) filter.totalAmount.$gte = parseFloat(minPrice);
      if (maxPrice) filter.totalAmount.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { user: regex },
        { _id: regex }
      ];
    }

    const aggregatePipeline = [];

    aggregatePipeline.push({
      $lookup: {
        from: 'shippings',
        localField: 'shipping',
        foreignField: '_id',
        as: 'shipping',
      },
    });

    aggregatePipeline.push({
      $unwind: { path: '$shipping', preserveNullAndEmptyArrays: true },
    });

    const matchStage = {};

    if (status && status !== 'All') matchStage.status = status;
    if (city && city !== 'All') matchStage['shipping.city'] = city;

    if (month) {
      const m = parseInt(month) - 1;
      const y = parseInt(year) || new Date().getFullYear();
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    } else if (year) {
      const y = parseInt(year);
      start = new Date(y, 0, 1);
      end = new Date(y + 1, 0, 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    if (minPrice || maxPrice) {
      matchStage.totalAmount = {};
      if (minPrice) matchStage.totalAmount.$gte = parseFloat(minPrice);
      if (maxPrice) matchStage.totalAmount.$lte = parseFloat(maxPrice);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      matchStage.$or = [
        { user: regex },
        { _id: regex }
      ];
    }

    aggregatePipeline.push({ $match: matchStage });

    // Sort stage
    let sortStage = {};
    switch (sortBy) {
      case 'priceAsc':
        sortStage.totalAmount = 1;
        break;
      case 'priceDesc':
        sortStage.totalAmount = -1;
        break;
      case 'dateAsc':
        sortStage.createdAt = 1;
        break;
      case 'dateDesc':
      default:
        sortStage.createdAt = -1;
        break;
    }

    aggregatePipeline.push({ $sort: sortStage });

    // Pagination
    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNum - 1) * pageSize;

    

    const totalOrdersResult = await Order.aggregate([
      ...aggregatePipeline.filter(stage => !('$skip' in stage || '$limit' in stage)),
      { $count: 'total' }
    ]);
    const totalOrders = totalOrdersResult[0]?.total || 0;

    aggregatePipeline.push({ $skip: skip });
    aggregatePipeline.push({ $limit: pageSize });

    const orders = await Order.aggregate(aggregatePipeline);

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      totalAmount: order.totalAmount,
      shippingCity: order.shipping?.city || null,
      trackingNumber: order.trackingNumber,
      orderNumber: order.orderNumber,
      isGuest: order.isGuest
    }));

    console.log('Match Stage:', matchStage);
    console.log('Sort Stage:', sortStage);

    return res.status(200).json({
      totalOrders,
      page: pageNum,
      limit: pageSize,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};



const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;

    if (!orderId || !newStatus) {
      return res.status(400).json({ message: "Missing orderId or newStatus" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



// const createOrderByGuest = async (req, res) => {
//   try {
//     const { userId, isGuest, cartItems, shipping: shippingData } = req.body;

//     if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
//       return res.status(400).json({ message: "Cart items are required and cannot be empty." });
//     }

//     if (!shippingData) {
//       return res.status(400).json({ message: "Shipping information is required." });
//     }

//     const shipping = new Shipping({
//       ...shippingData,
//       user: !isGuest ? userId : null,
//     });
//     await shipping.save();

//     let totalAmount = 0;
//     const cartItemsForCart = [];

//     for (const item of cartItems) {
//       if (!item.productId) {
//         return res.status(400).json({ message: "Each cart item must have a productId." });
//       }
//       if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
//         return res.status(400).json({ message: "Each cart item must have a valid quantity." });
//       }

//       const product = await Product.findById(item.productId);
//       if (!product) {
//         return res.status(404).json({ message: `Product not found: ${item.productId}` });
//       }

//       const price = product.price;
//       if (isNaN(price)) {
//         return res.status(400).json({ message: `Invalid price for product: ${product._id}` });
//       }

//       const itemTotal = price * item.quantity;
//       totalAmount += itemTotal;

//       cartItemsForCart.push({
//         product: product._id,
//         quantity: item.quantity,
//         price: price,
//       });
//     }

//     const cart = new Cart({
//       items: cartItemsForCart,
//       totalPrice: totalAmount,
//       user: !isGuest ? userId : null, 
//     });
//     await cart.save();

//     const newOrderNumber = await getNextOrderNumber();

//     const orderItems = cart.items.map(item => ({
//       productId: item.product._id,
//       name: item.product.name,
//       image: item.product.image,  
//       price: item.product.price,
//       quantity: item.quantity
// }));


//     let isGuestReal = false;
//       if (userId.length > 28) {
//       isGuestReal = true;
//     }

//     const order = new Order({
//       user: isGuestReal ? null : userId,
//       guestUserId: isGuestReal ? userId : null,
//       user: userId,
//       cart: cart._id,
//       shipping: shipping._id,
//       totalAmount: totalAmount,
//       isGuest: isGuestReal,
//       status: "Processing",
//       trackingNumber: 'TH-' + uuidv4().slice(0, 8).toUpperCase(),
//       orderNumber: newOrderNumber,
//       orderItems
//     });
//     await order.save();

//     return res.status(201).json({ order });

//   } catch (error) {
//     console.error("Error creating order by guest:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const createOrderByGuest = async (req, res) => {
  try {
    // Added couponCode to destructuring
    const { userId, isGuest, cartItems, shipping: shippingData, couponCode } = req.body; 

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart items are required and cannot be empty." });
    }

    if (!shippingData) {
      return res.status(400).json({ message: "Shipping information is required." });
    }

    // Logic for creating shipping and cart (remains same)
    const shipping = new Shipping({
      ...shippingData,
      user: !isGuest ? userId : null,
    });
    await shipping.save();

    let totalAmount = 0;
    const cartItemsForCart = [];

    for (const item of cartItems) {
        // ... product lookup and price calculation (remains same) ...
      if (!item.productId) { return res.status(400).json({ message: "Each cart item must have a productId." }); }
      if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) { return res.status(400).json({ message: "Each cart item must have a valid quantity." }); }

      const product = await Product.findById(item.productId);
      if (!product) { return res.status(404).json({ message: `Product not found: ${item.productId}` }); }

      const price = product.price;
      if (isNaN(price)) { return res.status(400).json({ message: `Invalid price for product: ${product._id}` }); }

      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      cartItemsForCart.push({
        product: product._id,
        quantity: item.quantity,
        price: price,
      });
    }

    const cart = new Cart({
      items: cartItemsForCart,
      totalPrice: totalAmount,
      user: !isGuest ? userId : null, 
    });
    await cart.save();

    // ------------------------------------------------------------------
    //  COUPON INTEGRATION (Guest Flow)
    // ------------------------------------------------------------------
    let finalTotal = totalAmount;
    let cashbackAmount = 0;
    let couponUsedCount = 0;

    if (couponCode) {
        // NOTE: Use userId (the guest UUID) for the coupon check
        const couponResult = await applyCouponAndGetDiscount(couponCode, userId, totalAmount); 
        finalTotal = couponResult.finalTotal;
        cashbackAmount = couponResult.cashback;
        couponUsedCount = couponResult.couponUsedCount;
    }
    // ------------------------------------------------------------------
    
    const newOrderNumber = await getNextOrderNumber();

    const orderItems = cart.items.map(item => ({
      productId: item.product._id,
      name: item.product.name,
      image: item.product.image,  
      price: item.product.price,
      quantity: item.quantity
    }));

    let isGuestReal = false;
      if (userId.length > 28) {
      isGuestReal = true;
    }

    // Determine actual user reference for Order model
    const userRef = isGuestReal ? null : userId;
    const guestUserRef = isGuestReal ? userId : null;

    const order = new Order({
      user: userRef, // Set to null if guest
      guestUserId: guestUserRef, // Keep the UUID for tracking
      cart: cart._id,
      shipping: shipping._id,
      totalAmount: finalTotal, //  Use discounted amount
      isGuest: isGuestReal,
      status: "Processing",
      trackingNumber: 'TH-' + uuidv4().slice(0, 8).toUpperCase(),
      orderNumber: newOrderNumber,
      orderItems,
      //  NEW FIELDS SAVED
      couponCode: couponCode || null,
      cashbackAmount: cashbackAmount,
      couponUsed: couponUsedCount,
    });
    await order.save();

    return res.status(201).json({ order });

  } catch (error) {
    console.error("Error creating order by guest:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const orderSummary = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).populate('orderItems.productId');

    if (!order) {
      return res.status(404).json({ message: "Cannot find order with this id" });
    }

    const orderResponse = {
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      orderItems: order.orderItems.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.imageUrl,
        quantity: item.quantity
      }))
    };

    return res.status(200).json({ order: orderResponse });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const trackOrder = async (req, res) => {
  const { trackingNumber } = req.params; 
  console.log('Tracking Number:', trackingNumber);

  try {
    const order = await Order.findOne({ trackingNumber }).select('status orderNumber trackingNumber');

    if (!order) {
      return res.status(404).json({ message: 'Order not found with this tracking number.' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('Error in trackOrder:', error.message);
    return res.status(500).json({ message: 'Server error while tracking order.' });
  }
};

const OrderByCityChart = async (req, res) => {
    try {
    const data = await Order.aggregate([
      {
        $lookup: {
          from: 'shippings',
          localField: 'shipping',
          foreignField: '_id',
          as: 'shippingInfo',
        },
      },
      { $unwind: "$shippingInfo" },
      {
        $group: {
          _id: "$shippingInfo.city",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stats", error: err.message });
  }
}

const OrdersOverTimeChart = async (req, res) => {
    try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } // Daily
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

const getGuestVsRegisteredStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: "$isGuest",
          count: { $sum: 1 },
        },
      },
    ]);

    const data = result.map((item) => ({
      type: item._id ? "Guest" : "Registered",
      count: item.count,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const TopCustomerChart = async (req, res) => {
  try {
    const topUsers = await Order.aggregate([
      {
        $match: { isGuest: false }
      },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 }
        }
      },
      {
        $sort: { totalOrders: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "uid",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 0,
          uid: "$_id",
          name: "$userDetails.name",
          email: "$userDetails.email",
          totalOrders: 1
        }
      }
    ]);

    res.json({ data: topUsers });
  } catch (error) {
    res.status(500).json({ message: "Failed to get top customers", error });
  }
};

const RevenueByCityChart = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $lookup: {
          from: "shippings", 
          localField: "shipping",
          foreignField: "_id",
          as: "shippingDetails"
        }
      },
      { $unwind: "$shippingDetails" },
      {
        $group: {
          _id: "$shippingDetails.city",
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ message: "Failed to get revenue by city", error: err });
  }
};

const RevenueByPeriodChart = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            quarter: {
              $concat: [
                { $toString: { $year: "$createdAt" } },
                "-Q",
                {
                  $toString: {
                    $ceil: { $divide: [{ $month: "$createdAt" }, 3] },
                  },
                },
              ],
            },
            year: { $year: "$createdAt" },
          },
          total: { $sum: "$totalAmount" },
        },
      },
      {
        $group: {
          _id: null,
          day: { $push: { label: "$_id.day", total: "$total" } },
          month: { $push: { label: "$_id.month", total: "$total" } },
          quarter: { $push: { label: "$_id.quarter", total: "$total" } },
          year: { $push: { label: { $toString: "$_id.year" }, total: "$total" } },
        },
      },
      {
        $project: { _id: 0, day: 1, month: 1, quarter: 1, year: 1 },
      },
    ];

    const result = await Order.aggregate(pipeline);
    res.status(200).json({ data: result[0] });
  } catch (err) {
    console.error("Error getting revenue stats:", err);
    res.status(500).json({ error: "Failed to get revenue stats" });
  }

}

const applyCouponAndGetDiscount = async (code, userId, cartTotal) => {
    if (!code) return { totalDiscount: 0, finalTotal: cartTotal, cashback: 0, couponUsedCount: 0 };
    
    // --- SIMULATION OF VALIDATION/APPLICATION ---
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon || coupon.validUntil < new Date() || coupon.timesUsed >= coupon.maxUses) {
        return { totalDiscount: 0, finalTotal: cartTotal, cashback: 0, couponUsedCount: 0 };
    }

    let discount = 0;
    let cashback = 0;

    switch (coupon.type) {
        case 'PERCENTAGE':
            discount = cartTotal * (coupon.value / 100);
            break;
        case 'FIXED_AMOUNT':
            discount = coupon.value;
            break;
        case 'CASHBACK':
            cashback = coupon.value;
            break;
        default:
            discount = 0;
    }

    // Mark coupon as used (CRITICAL STEP)
    await Coupon.updateOne(
        { _id: coupon._id },
        { 
            $inc: { timesUsed: 1 }, 
            $push: { userHistory: { userId: userId } }
        }
    );

    return { 
        totalDiscount: discount, 
        finalTotal: Math.max(0, cartTotal - discount), 
        cashback: cashback,
        couponUsedCount: 1 
    };
};


module.exports = {
  createOrder,
  getAllOrdersForAdmin,
  updateOrderStatus,
  createOrderByGuest,
  orderSummary,
  trackOrder,
  OrderByCityChart,
  OrdersOverTimeChart,
  getGuestVsRegisteredStats,
  TopCustomerChart,
  RevenueByCityChart,
  RevenueByPeriodChart,
};
