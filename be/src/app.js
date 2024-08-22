const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const transactionRoutes = require("./routes/transactionRoutes");
const jobRoutes = require("./routes/jobRoutes");
const { startCronJobs } = require("./jobs/cronJobs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/jobs", jobRoutes);

// Start cron jobs
startCronJobs();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
