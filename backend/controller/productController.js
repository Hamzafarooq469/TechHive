
const express = require('express');
const Product = require("../models/productModel");
const { PutObjectCommand, DeleteObjectCommand  } = require("@aws-sdk/client-s3");
const Order = require("../models/orderModel")
const s3 = require("../services/s3");
const { v4: uuidv4 } = require("uuid");
const redisClient = require('../services/redisClient');


const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, stock } = req.body;
    const file = req.file; 
    const user = req.user; 

    if (!name || !description || !category || !price || !stock || !file) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const fileKey = `products/${uuidv4()}-${file.originalname}`; // Unique file key for the image

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read", // Allow public read access
    };

    // Upload the image to S3
    await s3.send(new PutObjectCommand(uploadParams));

    // Generate the image URL
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Create the product object
    const product = new Product({
      user: user._id,  
      createdBy: user.name,  
      name,
      description,
      category,
      price,
      stock,
      imageUrl,  
    });

    await product.save();



    return res.status(201).json({ message: "Product created successfully"});
  } catch (error) {
    console.error("Error creating product:", error);  
    return res.status(500).json({ message: "Error creating product", error: error.message });
  }
};


const getAllProductsForAdmin = async (req, res) => {
    try {
      const products = await Product.find().select();
      // console.log("Products fetched for admin:", products);
      return res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ message: "Error fetching products", error: error.message });
    }
}

const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const category = req.query.category || '';
    const sort = req.query.sort || '';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: isNaN(parseFloat(search)) ? undefined : parseFloat(search) },
      ].filter(Boolean);
    }

    if (category) query.category = category;

    query.price = { $gte: minPrice, $lte: maxPrice };

    let sortOption = {};
    if (sort === 'asc') sortOption.price = 1;
    else if (sort === 'desc') sortOption.price = -1;

    const cacheKey = `products:${page}:${limit}:${search}:${category}:${sort}:${minPrice}:${maxPrice}`;

    //  Try to serve from Redis cache with error handling
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`✅ [Redis Cache HIT] Key: ${cacheKey}`);
        return res.status(200).json(JSON.parse(cachedData));
      }
    } catch (redisError) {
      console.log(`⚠️ Redis not available, fetching from database directly: ${redisError.message}`);
    }

    console.log(` [Redis Cache MISS] Key: ${cacheKey}. Fetching from DB...`);

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const response = {
      products,
      totalPages,
      currentPage: page,
    };

    // ⏳ Store the response in Redis for 10 minutes (600 seconds) with error handling
    try {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
      console.log(` [Redis SET] Cached new data under key: ${cacheKey}`);
    } catch (redisError) {
      console.log(`⚠️ Could not cache data in Redis: ${redisError.message}`);
    }

    // console.log("Products fetched: 1", products);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { name, description, category, price, stock } = req.body;
  console.log(req.body)
  const { id } = req.params;
  const file = req.file;  // New file if uploaded

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Preserve old image URL
    let imageUrl = product.imageUrl;

    // If a new file is uploaded, delete old image from S3 and upload the new one
    if (file) {
      const oldImageKey = product.imageUrl?.split(".com/")[1];  // Get the S3 key from the old URL

      if (oldImageKey) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: decodeURIComponent(oldImageKey), // Decode to handle any special characters in S3 key
          }));
          console.log(`🗑️ Old image deleted from S3: ${oldImageKey}`);
        } catch (err) {
          console.error("❌ Error deleting old image from S3:", err);
        }
      }

      // Upload the new image to S3
      const fileKey = `products/${uuidv4()}-${file.originalname}`; // Unique file key
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read", // Set file to be publicly readable
      };

      await s3.send(new PutObjectCommand(uploadParams));

      // Construct new image URL
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    }

    // Update only the fields that are provided
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price !== '' && price !== 'null' && !isNaN(price)) product.price = Number(price);
    if (stock !== '' && stock !== 'null' && !isNaN(stock)) product.stock = Number(stock);

    product.imageUrl = imageUrl;  // Update image URL

    // Save updated product to database
    await product.save();

    try {
      await redisClient.del(`productDetail:${id}`);
    } catch (err) {
      console.log(`⚠️ Could not invalidate product detail cache: ${err.message}`);
    }

    // Invalidate all paginated/filtered product lists
    try {
      const keys = await redisClient.keys('products:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🧹 Invalidated ${keys.length} cached product list keys`);
      }
    } catch (err) {
      console.log(`⚠️ Could not invalidate product list cache: ${err.message}`);
    }

    // Respond with success
    return res.status(200).json({ message: "Product updated successfully", cache: "Cache invalidated", product });
  } catch (error) {
    console.error("❌ Update error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  
  try {
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get the S3 key of the image
    const oldImageKey = product.imageUrl?.split(".com/")[1]; // Extract the key from the image URL

    // If an image URL exists, delete it from S3
    if (oldImageKey) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: decodeURIComponent(oldImageKey), // Decode to handle any special characters in the S3 key
        }));
        console.log(`🗑️ Old image deleted from S3: ${oldImageKey}`);
      } catch (err) {
        console.error("❌ Error deleting old image from S3:", err);
      }
    }

    await Product.findByIdAndDelete(id);

    try {
      await redisClient.del(`productDetail:${id}`);
    } catch (err) {
      console.log(`⚠️ Could not invalidate product detail cache: ${err.message}`);
    }

    try {
      const keys = await redisClient.keys('products:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🧹 Invalidated ${keys.length} cached product list keys`);
      }
    } catch (err) {
      console.log(`⚠️ Could not invalidate product list cache: ${err.message}`);
    }

    return res.status(200).json({ message: "Product deleted successfully", cache: "Cache invalidated", });

  } catch (error) {
    console.error("❌ Error deleting product:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `product:${id}`;

    //  Try to serve from Redis cache with error handling
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`✅ [Redis Cache HIT] Key: ${cacheKey}`);
        return res.status(200).json(JSON.parse(cachedData));
      }
    } catch (redisError) {
      console.log(`⚠️ Redis not available, fetching from database directly: ${redisError.message}`);
    }

    console.log(`⛔ [Redis Cache MISS] Key: ${cacheKey}. Fetching from DB...`);

    const product = await Product.findById(id);

    if (!product) {
      console.warn(`⚠️ Product not found in DB for ID: ${id}`);
      return res.status(404).json({ message: 'Product not found' });
    }

    //  Store in Redis for 1 hour (3600 seconds) with error handling
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
      console.log(`✅ [Redis SET] Cached product under key: ${cacheKey}`);
    } catch (redisError) {
      console.log(`⚠️ Could not cache product in Redis: ${redisError.message}`);
    }

    return res.status(200).json(product);

  } catch (error) {
    console.error('❌ Error fetching product details:', error);
    return res.status(500).json({ message: 'Error fetching product details', error: error.message });
  }
};


const getProductDetailsForAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product); // return the product data
  } catch (error) {
    console.error("Error fetching product details:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const ProductCategoryChart = async (req, res) => {
  try {
        const data = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    res.json({ success: true, data });
  } catch (error) {
        console.error("Error getting category stats:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
}

const ProductAveragePriceChart = async (req, res) => {
    try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          averagePrice: { $avg: '$price' },
        },
      },
      { $sort: { averagePrice: -1 } },
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching average price by category:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

const ProductCreatedOverTimeChart = async (req, res) => {
  try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const ProductUpdatedOverTimeChart = async (req, res) => {
  try {
    const data = await Product.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$updatedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProductCountPerUser = async (req, res) => {
  try {
    const data = await Product.aggregate([
      {
        $group: {
          _id: "$user",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users", 
          localField: "_id", 
          foreignField: "uid", 
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          user: "$userDetails.name",
          count: 1
        }
      }
    ]);

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error in products-per-user stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const StockPerProductChart = async (req, res) => {
  try {
    const data = await Product.find({}, { name: 1, stock: 1, _id: 0 });

    const transformed = data.map((item) => ({
      name: item.name,
      stock: Number(item.stock)
    }));

    res.json({ success: true, data: transformed });
  } catch (err) {
    console.error("Error getting stock per product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id } = req.params;
    
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);
    console.log("Request params:", req.params);

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { uid, name } = req.user;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Comment is required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newComment = {
      user: uid,
      name: name || "Anonymous", 
      comment: comment.trim(),
      timestamp: new Date()
    };

    product.comments.push(newComment);
    await product.save();

    return res.status(200).json({ 
      message: "Comment added successfully", 
      comments: product.comments 
    });

  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

const addRating = async (req, res) => {
  try {
    const { value } = req.body;
    const { id } = req.params;
    
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);
    console.log("Request params:", req.params);

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { uid } = req.user;

    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already rated this product
    // const existingRatingIndex = product.ratings.findIndex(r => r.user === uid);
    const existingRatingIndex = product.ratings.findIndex(r => r.user.toString() === uid);

    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      product.ratings[existingRatingIndex].value = value;
    } else {
      // Add new rating
      product.ratings.push({ user: uid, value });
    }

    await product.save();
    
    return res.status(200).json({ 
      message: "Rating submitted successfully", 
      ratings: product.ratings 
    });

  } catch (error) {
    console.error("Add rating error:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};


module.exports = {
    createProduct,
    getAllProductsForAdmin,
    getAllProducts,
    updateProduct,
    deleteProduct,
    getProductDetails,
    getProductDetailsForAdmin,
    ProductCategoryChart,
    ProductAveragePriceChart,
    ProductCreatedOverTimeChart,
    ProductUpdatedOverTimeChart,
    getProductCountPerUser,
    StockPerProductChart,
    addComment,
    addRating,
};
