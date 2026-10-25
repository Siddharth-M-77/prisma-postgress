import "dotenv/config";
import express from "express";
import { connectDB } from "./config/db.js";
import UserRouter from "./router/user.routers.js";
const app = express()
app.use(express.json())
app.use("/api/users", UserRouter)

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
})
