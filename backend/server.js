import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import gameRoutes from './routes/gameRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(' MongoDB Connected Successfully');
        console.log(`Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error(' MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

connectDB();

mongoose.connection.on('connected', () => {
    console.log(' Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error(' Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log(' Mongoose disconnected from MongoDB');
});


app.use('/api/game', gameRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AR Shooting Game Backend is running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});


app.get('/', (req, res) => {
    res.json({
        message: '🎮 Welcome to AR Shooting Game API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            submitScore: 'POST /api/game/score',
            leaderboard: 'GET /api/game/leaderboard',
            playerStats: 'GET /api/game/stats/:playerName',
            playerSessions: 'GET /api/game/sessions/:playerName',
            endSession: 'POST /api/game/session/end',
            globalStats: 'GET /api/game/global-stats'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
    console.log(` API URL: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGINT', async () => {
    console.log('\n Shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});
