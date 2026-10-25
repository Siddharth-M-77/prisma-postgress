import express from "express";
import { userLogin, userRegister } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validations/user.validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), userRegister);
router.post("/login", validate(loginSchema), userLogin);

export default router;
