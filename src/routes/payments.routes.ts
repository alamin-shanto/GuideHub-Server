import { Router } from "express";
import {
  createPaymentIntent,
  handleStripeWebhook,
} from "../controllers/payments.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/create-intent", protect, createPaymentIntent);
// webhook endpoint usually needs raw body middleware, handle separately in index/app
router.post("/webhook", handleStripeWebhook);

export default router;
