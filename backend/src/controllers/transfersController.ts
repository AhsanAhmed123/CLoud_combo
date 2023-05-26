import { Request, Response } from "express";
import { Transfers } from "../models/Transfers";
import axios from "axios";
import axiosRetry from "axios-retry";

// Apply the retry configuration globally
axiosRetry(axios, {
  retries: 20, // Adjust this value as needed
  retryDelay: (retryCount) => retryCount * 100, // Adjust this value as needed
  shouldResetTimeout: true,
});

export async function getTransfers(req: Request, res: Response) {
  try {
    const { userId } = req.query;

    const transfers = await Transfers.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: "Transfers listed successfully",
      data: transfers,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.json({
      success: false,
      message: "Failed to get transfers",
      error: error,
    });
  }
}
