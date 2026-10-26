import Joi from "joi";

export const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50),
    email: Joi.string().trim().lowercase().email(),
    password: Joi.string().min(6),
}).min(1);

export const changePasswordSchema = Joi.object({
    oldPassword:Joi.string().required("Old password is required"),
    newPassword:Joi.string().min(6).required("New password is required"),
})

export const investsSchema = Joi.object({
    investmentAmount:Joi.number().min(1).max(1000000).required("Investment amount is required"),
    txHash:Joi.string().required("Transaction hash is required"),
})