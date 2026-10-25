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
