import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Notification } from "../models/Notification";
import { toSafeObject } from "../utils/sanitize";
import type { AuthenticatedRequest } from "../middleware/auth";

export const listNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const unread = await Notification.countDocuments({
      recipientId: new Types.ObjectId(authReq.user!.sub),
      read: false,
    });
    const items = await Notification.find({ recipientId: new Types.ObjectId(authReq.user!.sub) })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: { items: items.map((n) => toSafeObject(n)), unread } });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { ids } = req.body as { ids?: string[] };
    const query = ids?.length
      ? { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } }
      : {};
    const result = await Notification.updateMany(
      { ...query, recipientId: new Types.ObjectId(authReq.user!.sub) },
      { read: true }
    );
    res.json({ success: true, data: { marked: result.modifiedCount } });
  } catch (err) {
    next(err);
  }
};
