import { prisma } from "../../lib/prisma.js";
import { getTodayStartIST } from "../../utils/date.js";

// Decimal ko string mein bhejo (paise mein precision na jaye), khali ho to "0"
const toAmount = (value) => (value ?? 0).toString();

// Ek table ka total aur aaj ka: count + amount ka sum
const totalAndToday = async (model, today, where = {}) => {
    const [total, todayStats] = await Promise.all([
        model.aggregate({ where, _count: true, _sum: { amount: true } }),
        model.aggregate({ where: { ...where, createdAt: { gte: today } }, _count: true, _sum: { amount: true } }),
    ]);
    return {
        total: { count: total._count, amount: toAmount(total._sum.amount) },
        today: { count: todayStats._count, amount: toAmount(todayStats._sum.amount) },
    };
};

export const getDashboardStats = async (req, res) => {
    const today = getTodayStartIST();
    try {
        // Saari queries ek saath chalti hain, ek ke baad ek nahi
        const [
            totalUsers,
            todayUsers,
            investments,
            activeInvestments,
            roi,
            levelIncome,
            referralBonus,
            withdrawals,
            pendingWithdrawals,
            approvedWithdrawals,
            rejectedWithdrawals,
            wallets,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: today } } }),
            totalAndToday(prisma.investment, today),
            prisma.investment.count({ where: { status: "ACTIVE" } }),
            totalAndToday(prisma.roi, today),
            totalAndToday(prisma.levelIncome, today),
            totalAndToday(prisma.referralBonus, today),
            totalAndToday(prisma.withdrawal, today),
            totalAndToday(prisma.withdrawal, today, { status: "PENDING" }),
            totalAndToday(prisma.withdrawal, today, { status: "APPROVED" }),
            totalAndToday(prisma.withdrawal, today, { status: "REJECTED" }),
            // Users ke wallets mein abhi kitna paisa pada hai
            prisma.user.aggregate({
                _sum: { mainWallet: true, roiWallet: true, levelWallet: true, referralWallet: true },
            }),
        ]);

        return res.status(200).json({
            users: { total: totalUsers, today: todayUsers },
            investments: { ...investments, active: activeInvestments },
            roi,
            levelIncome,
            referralBonus,
            withdrawals: {
                ...withdrawals,
                pending: pendingWithdrawals,
                approved: approvedWithdrawals,
                rejected: rejectedWithdrawals,
            },
            walletBalances: {
                mainWallet: toAmount(wallets._sum.mainWallet),
                roiWallet: toAmount(wallets._sum.roiWallet),
                levelWallet: toAmount(wallets._sum.levelWallet),
                referralWallet: toAmount(wallets._sum.referralWallet),
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
