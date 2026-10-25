import { prisma } from "../lib/prisma.js";

export const connectDB = async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("Database connected");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};
