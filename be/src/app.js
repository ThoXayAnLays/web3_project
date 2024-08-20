const express = require('express');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const cronService = require('./services/cronService');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

cronService.initializeJobs();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});