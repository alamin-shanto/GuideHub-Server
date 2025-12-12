import { Request, Response } from "express";
import Booking from "../models/Booking.model";
import Listing from "../models/Listing.model";
import asyncHandler from "../middleware/asyncHandler";

export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user?._id;
    if (!user) return res.status(401).json({ message: "Not authorized" });

    const { listingId, startDate, endDate } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalPrice = listing.price * days;

    const booking = new Booking({
      listing: listing._id,
      user,
      startDate: start,
      endDate: end,
      totalPrice,
    });

    await booking.save();
    res.status(201).json({ booking });
  }
);

export const getUserBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user?._id;
    if (!user) return res.status(401).json({ message: "Not authorized" });

    const bookings = await Booking.find({ user }).populate("listing");
    res.json({ bookings });
  }
);

export const getListingBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const { listingId } = req.params;
    const bookings = await Booking.find({ listing: listingId }).populate(
      "user",
      "name email"
    );
    res.json({ bookings });
  }
);
