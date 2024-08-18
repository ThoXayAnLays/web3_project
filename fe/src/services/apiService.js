import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const apiService = {
    async getUserTransactions(userAddress, page = 1, sortBy = 'timestamp', sortOrder = 'DESC', search = '') {
        const response = await axios.get(`${API_URL}/transactions/${userAddress}`, {
            params: { page, sortBy, sortOrder, search }
        });
        return response.data;
    },

    async getAllTransactions(page = 1, sortBy = 'timestamp', sortOrder = 'DESC', search = '') {
        const response = await axios.get(`${API_URL}/admin/transactions`, {
            params: { page, sortBy, sortOrder, search }
        });
        return response.data;
    },

    async updateAPR(newAPR) {
        const response = await axios.put(`${API_URL}/admin/apr`, { newAPR });
        return response.data;
    },

    async getJobs(page = 1, sortBy = 'created_at', sortOrder = 'DESC', search = '') {
        const response = await axios.get(`${API_URL}/admin/jobs`, {
            params: { page, sortBy, sortOrder, search }
        });
        return response.data;
    },

    async retryJob(jobId) {
        const response = await axios.post(`${API_URL}/admin/jobs/retry`, { jobId });
        return response.data;
    },
};

export default apiService;