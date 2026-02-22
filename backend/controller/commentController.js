
const Comment = require("../models/commentModel.js");
const Product = require("../models/productModel");

//  Utility to update average rating
const updateAverageRating = async (productId) => {
  const comments = await Comment.find({ productId });

  // Filter only comments that have a valid rating (1–5)
  const ratedComments = comments.filter(c => c.rating >= 1);

  if (ratedComments.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      ratingCount: 0,
    });
    return;
  }

  const totalRatings = ratedComments.reduce((sum, c) => sum + c.rating, 0);
  const avgRating = totalRatings / ratedComments.length;

  await Product.findByIdAndUpdate(productId, {
    averageRating: avgRating.toFixed(1),
    ratingCount: ratedComments.length,
  });
};

//  Add comment
// const addComment = async (req, res) => {
//   try {
//     const { productId, userId, userName, rating, comment } = req.body;
//     console.log(req.body)

//     // Require at least a comment or a rating
//     if ((!comment || comment.trim() === '') && (!rating || rating === 0)) {
//       return res.status(400).json({ error: "Either comment or rating is required." });
//     }

//     const newComment = new Comment({
//       productId,
//       userId,
//       userName,
//       rating,
//       comment
//     });

//     await newComment.save();

//     // Recalculate average rating only if any rating exists
//     const allComments = await Comment.find({ productId });
//     const ratedComments = allComments.filter(c => c.rating && c.rating > 0);

//     let avgRating = 0;
//     if (ratedComments.length > 0) {
//       const totalRatings = ratedComments.reduce((sum, c) => sum + c.rating, 0);
//       avgRating = totalRatings / ratedComments.length;
//     }

//     // Update product with new average rating
//     await Product.findByIdAndUpdate(productId, {
//       averageRating: avgRating.toFixed(1),
//       ratingCount: ratedComments.length
//     });

//     res.status(201).json(newComment);
//   } catch (error) {
//     console.error("Error adding comment:", error);
//     res.status(500).json({ error: "Failed to add comment." });
//   }
// }

const addComment = async (req, res) => {
  try {
    const { productId, user, userName, rating, comment } = req.body;
    console.log(req.body)

    // Require at least a comment or a rating
    if ((!comment || comment.trim() === '') && (!rating || rating === 0)) {
      return res.status(400).json({ error: "Either comment or rating is required." });
    }

    const newComment = new Comment({
      productId,
      user,
      userName,
      rating,
      comment
    });

    await newComment.save();

    // Recalculate average rating only if any rating exists
    const allComments = await Comment.find({ productId });
    const ratedComments = allComments.filter(c => c.rating && c.rating > 0);

    let avgRating = 0;
    if (ratedComments.length > 0) {
      const totalRatings = ratedComments.reduce((sum, c) => sum + c.rating, 0);
      avgRating = totalRatings / ratedComments.length;
    }

    // Update product with new average rating
    await Product.findByIdAndUpdate(productId, {
      averageRating: avgRating.toFixed(1),
      ratingCount: ratedComments.length
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment." });
  }
};



const getCommentsForProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, sort, page = 1, limit = 5 } = req.query;

    const filter = { productId };
    if (rating && rating !== "all") {
      filter.rating = parseInt(rating);
    }

    let sortOption = { createdAt: -1 }; // default: most recent
    if (sort === "high") sortOption = { rating: -1 };
    else if (sort === "low") sortOption = { rating: 1 };

    const comments = await Comment.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(filter);

    res.status(200).json({ comments, total });
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error: error.message });
  }
};

//  Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params)

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    await updateAverageRating(deletedComment.productId);

    res.status(200).json({ message: "Comment deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Error deleting comment", details: error.message });
  }
};

//  Update a comment
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating } = req.body;

    if ((!comment || comment.trim() === '') && (!rating || rating === 0)) {
      return res.status(400).json({ error: "Either comment or rating is required." });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { comment, rating },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    await updateAverageRating(updatedComment.productId);

    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: "Error updating comment", details: error.message });
  }
};

const getCommentStats = async (req, res) => {
  const { productId } = req.params;

  try {
    const stats = await Comment.aggregate([
      { $match: { productId } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ]);

    const avg = await Comment.aggregate([
      { $match: { productId, rating: { $gte: 1 } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 }
        }
      }
    ]);

    res.json({
      averageRating: avg[0]?.avgRating?.toFixed(1) || "0.0",
      ratingBreakdown: stats.reduce((acc, val) => ({ ...acc, [val._id]: val.count }), {}),
      ratingCount: avg[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get comment stats" });
  }
};

// const getCommentsByUser = async (req, res) => {
//   try {
//     const { uid } = req.params;
//     const comments = await Comment.find({ userId: uid }).sort({ createdAt: -1 });

//     const total = await Comment.countDocuments({ userId: uid });

//     res.status(200).json({ comments, total });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching user comments", error: error.message });
//   }
// };

const getCommentsByUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const comments = await Comment.find({ user: uid }).sort({ createdAt: -1 });

    const total = await Comment.countDocuments({ user: uid });

    res.status(200).json({ comments, total });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user comments", error: error.message });
  }
};

const getRecentComments = async (req, res) => {
  try {
    const comments = await Comment.find({ rating: { $gte: 1 } })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("userName rating comment createdAt");

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent comments" });
  }
};


module.exports = {
  addComment,
  getCommentsForProduct,
  deleteComment,
  updateComment,
  getCommentStats,
  getCommentsByUser,
  getRecentComments
};
