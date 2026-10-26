import express from "express";
import { Investment, userLogin, userRegister } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, investsSchema } from "../validations/user.validation.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", authenticate,validate(registerSchema), userRegister);
router.post("/login", authenticate,validate(loginSchema), userLogin);
router.post("/invest", authenticate, validate(investsSchema), Investment);

export default router;
