import mongoose from "mongoose";

async function dbConnect() {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicDB';

    try {
        await mongoose.connect(dbUri, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, 
        });
        console.log("MongoDB connected successfully");

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err.message);
        });
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw new Error("Failed to connect to MongoDB");
    }
}

export default dbConnect;