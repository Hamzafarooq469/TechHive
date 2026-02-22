
const express = require("express")
const { signUp, signIn, getAllUsersForAdmin, forgotPassword, UsersCreatedOverTimeChart, getAllUsers, searchUsers } = require("../controller/userController")
const { isAuth, hasRole } = require("../middleware/m2");


const router = express.Router()

router.post("/signUp", signUp)
router.post("/signIn", signIn)

router.get("/getAllUsersForAdmin", isAuth, hasRole("admin"), getAllUsersForAdmin)

router.post("/forgotPassword", forgotPassword)

router.get("/stats/createdOverTime", UsersCreatedOverTimeChart);
router.get('/all', getAllUsers);
router.get('/search', searchUsers);

// router.get('/verifyAdmin', isAuth, hasRole('admin'), (req, res) => {
//   res.json({ isAdmin: true });
// });


module.exports = router
