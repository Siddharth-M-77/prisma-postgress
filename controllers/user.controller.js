import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Response mein password kabhi nahi bhejna
const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    createdAt: true,
    updatedAt: true,
};

export const userRegister = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            },
            select: userSelect
        })
        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        // Do request ek saath same email se aayein to findUnique dono ko pass kar sakta hai
        if (error.code === "P2002") {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })
        // Same message dono case mein, taaki koi check na kar sake ki email registered hai ya nahi
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: userSelect
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, password } = req.body;
    try {
        const updatedData = {};
        if (name) updatedData.name = name;
        if (email) updatedData.email = email;
        if (password) {
            updatedData.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updatedData,
            select: userSelect
        })
        return res.status(200).json({ message: "User profile updated successfully", user: updatedUser });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ message: "User not found" });
        }
        if (error.code === "P2002") {
            return res.status(400).json({ message: "This email is already in use" });
        }
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
