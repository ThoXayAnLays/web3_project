import React from "react";
import { Link } from "react-router-dom";
import { Typography, Button, Box } from "@mui/material";

const NotFound = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            textAlign="center"
            p={3}
        >
            <Typography variant="h1" component="h1" gutterBottom>
                404
            </Typography>
            <Typography variant="h4" component="h2" gutterBottom>
                Oops! Page Not Found
            </Typography>
            <Typography variant="body1" paragraph>
                The page you are looking for might have been removed, had its
                name changed, or is temporarily unavailable.
            </Typography>
            <Button component={Link} to="/" variant="contained" color="primary">
                Go to Homepage
            </Button>
        </Box>
    );
};

export default NotFound;
