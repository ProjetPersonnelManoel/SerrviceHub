import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import {
  loginLimiter,
  sensitiveLimiter,
} from "../middlewares/rateLimit.middlewares";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "../Validation/auth.validation";

export const authRouter = (): Router => {
  const router = Router();
  const authController = new AuthController();

  router.post(
    "/register",
    sensitiveLimiter,
    validate(registerSchema),
    authController.register,
  );
  router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    authController.login,
  );
  router.post("/logout", authController.logout);
  router.get("/me", authenticate, authController.me);
  router.patch(
    "/password",
    sensitiveLimiter,
    authenticate,
    validate(changePasswordSchema),
    authController.changePassword,
  );

  return router;
};
