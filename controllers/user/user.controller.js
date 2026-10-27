import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Prisma } from "../../generated/prisma/client.js";

// Sponsor ko har investment pe kitna percent bonus
const REFERRAL_BONUS_PERCENT = 5;

// Response mein password kabhi nahi bhejna
const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    referralCode: true,
    createdAt: true,
    updatedAt: true,
};

// 0/O aur 1/I jaise milte-julte characters nahi, taaki code padhne mein galti na ho
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateReferralCode = async () => {
    while (true) {
        const bytes = crypto.randomBytes(8);
        const code = Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
        const taken = await prisma.user.findUnique({ where: { referralCode: code } });
        if (!taken) return code;
    }
};

export const userRegister = async (req, res) => {
    const { name, email, password, referralCode } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }
        let sponsorId = null;
        if (referralCode) {
            const sponsor = await prisma.user.findUnique({ where: { referralCode } });
            if (!sponsor) {
                return res.status(400).json({ message: "Invalid referral code" });
            }
            sponsorId = sponsor.id;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                referralCode: await generateReferralCode(),
                sponsorId
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

export const Investment = async (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
    }
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    try {
        const investment = await prisma.$transaction(async (tx) => {
            const investment = await tx.investment.create({
                data: {
                    userId,
                    amount: amount,
                    dailyRoiPercent: 1,
                    totalDays: 30,
                    status: "ACTIVE",
                }
            });

            if (user.sponsorId) {
                const bonus = new Prisma.Decimal(amount).mul(REFERRAL_BONUS_PERCENT).div(100).toDecimalPlaces(4);
                await tx.referralBonus.create({
                    data: {
                        userId: user.sponsorId,
                        receivedFromId: userId,
                        investmentId: investment.id,
                        baseAmount: amount,
                        percent: REFERRAL_BONUS_PERCENT,
                        amount: bonus,
                    }
                });
                await tx.user.update({
                    where: { id: user.sponsorId },
                    data: { referralWallet: { increment: bonus } }
                });
            }
            return investment;
        });
        return res.status(201).json({ message: "Investment created successfully", investment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}   
export const getUserInvestments = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const [investments, total] = await prisma.$transaction([
            prisma.investment.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    amount: true,
                    dailyRoiPercent: true,
                    totalDays: true,
                    daysPaid: true,
                    status: true,
                    createdAt: true,
                },
            }),
            prisma.investment.count({ where: { userId } }),
        ]);

        return res.status(200).json({
            investments,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserReferralBonuses = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const [referralBonuses, total] = await prisma.$transaction([
            prisma.referralBonus.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    investmentId: true,
                    baseAmount: true,
                    percent: true,
                    amount: true,
                    createdAt: true,
                    receivedFrom: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.referralBonus.count({ where: { userId } }),
        ]);

        return res.status(200).json({
            referralBonuses,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
