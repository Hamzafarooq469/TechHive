
const express = require("express")
const{ addComment, getCommentsForProduct, deleteComment, updateComment, getCommentStats, getCommentsByUser, getRecentComments } = require('../controller/commentController');

const router = express.Router();

router.post('/add', addComment);
router.get('/product/:productId', getCommentsForProduct);

router.delete('/delete/:id', deleteComment);
router.put('/update/:id', updateComment);

router.get("/comment/stats/:productId", getCommentStats)

router.get('/user/:uid', getCommentsByUser);

router.get("/recent", getRecentComments);

module.exports = router
