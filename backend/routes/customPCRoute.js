const express = require("express");
const { 
  startPCBuild, 
  getPCBuild, 
  getUserPCBuilds, 
  addComponent, 
  cancelPCBuild, 
  saveBuildToCart 
} = require("../controller/customPCController");

const router = express.Router();

router.post("/start", startPCBuild);
router.get("/build/:id", getPCBuild);
router.get("/user-builds", getUserPCBuilds);
router.post("/add-component", addComponent);
router.put("/cancel/:id", cancelPCBuild);
router.post("/save-to-cart/:id", saveBuildToCart);

module.exports = router;
