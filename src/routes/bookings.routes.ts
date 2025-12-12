import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  getListingBookings,
} from "../controllers/bookings.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, createBooking);
router.get("/me", protect, getUserBookings);
router.get("/listing/:listingId", getListingBookings);

export default router;
