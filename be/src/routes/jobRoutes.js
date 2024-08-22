const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const { isAdmin } = require("../middleware/authMiddleware");

router.get("/status", isAdmin, jobController.getJobStatus);
router.post("/run", isAdmin, jobController.runJob);

module.exports = router;
