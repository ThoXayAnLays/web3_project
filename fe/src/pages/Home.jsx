import React from 'react';
import { Typography, Container } from '@mui/material';

const Home = () => {
    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Welcome to DeFi Project
            </Typography>
            <Typography variant="body1" gutterBottom>
                This is a decentralized finance project where you can stake Token A and earn rewards.
            </Typography>
        </Container>
    );
};

export default Home;