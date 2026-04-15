const request = require('supertest');
const express = require('express');
const authRoutes = require('../../../src/routes/auth.routes');
const { login } = require('../../../src/services/authService');

// Mock authService
jest.mock('../../../src/services/authService', () => ({
    login: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
// Mock error handler
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
});

describe('Auth Integration Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('POST /api/auth/login should return 400 for missing fields', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'admin@geobackend.com' }); // Missing password only

        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toEqual('error');
        expect(res.body.message).toContain('password'); // Joi error msg validation
    });

    it('POST /api/auth/login should return token on success', async () => {
        login.mockResolvedValue({ user: { email: 'admin@geobackend.com' }, token: 'mockToken' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@geobackend.com', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.token).toEqual('mockToken');
        expect(res.body.data.user.email).toEqual('admin@geobackend.com');
    });
});
