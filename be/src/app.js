const express = require("express");
const mongoose = require("mongoose");
const kue = require("kue");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

const adminRoutes = require("./routes/admin");
const transactionRoutes = require("./routes/transactions");

const app = express();

mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.log(err));

app.use(cors());
app.use(bodyParser.json());

app.use("/api/admin", adminRoutes);
app.use("/api/transactions", transactionRoutes);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));

// Kue UI
kue.app.listen(3001, () => {
    console.log("Kue UI running on http://localhost:3001");
});
