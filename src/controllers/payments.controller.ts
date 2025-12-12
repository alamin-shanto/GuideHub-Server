import { Request, Response } from "express";
import Payment from "../models/Payment.model";
import Booking from "../models/Booking.model";
import stripeClient from "../utils/stripe";
import asyncHandler from "../middleware/asyncHandler";

export const createPaymentIntent = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const amount = Math.round((booking.totalPrice || 0) * 100); // cents

    const intent = await stripeClient.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { bookingId: booking._id.toString() },
    });

    const payment = new Payment({
      booking: booking._id,
      amount: booking.totalPrice,
      status: "pending",
      stripeChargeId: intent.id,
    });
    await payment.save();

    res.json({ clientSecret: intent.client_secret });
  }
);

export const handleStripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // Keep simple: verify signature, update payment status (implement as needed)
    res.json({ received: true });
  }
);
