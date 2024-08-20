import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const getTransactions = async (page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'DESC', search = '') => {
    try {
        const response = await axios.get(`${API_URL}/transactions`, {
            params: { page, limit, sortBy, sortOrder, search }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

export const getUserTransactions = async (userAddress, page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'DESC') => {
    try {
        const response = await axios.get(`${API_URL}/transactions/${userAddress}`, {
            params: { page, limit, sortBy, sortOrder }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user transactions:', error);
        throw error;
    }
};