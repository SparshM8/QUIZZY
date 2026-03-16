import { Response, NextFunction } from "express";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import { audit } from "../models/AuditEvent";
import { Paginated } from "../types/shared";

import { toSafeObject } from "../utils/sanitize";

export const listUsersController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.role = req.query.role;
    const [items, total] = await Promise.all([
      User.find(filter).select("-password -refreshToken").skip((page - 1) * pageSize).limit(pageSize).lean(),
      User.countDocuments(filter),
    ]);
    const payload: Paginated<Record<string, unknown>> = { items: items as Record<string, unknown>[], total, page, pageSize, pages: Math.ceil(total / pageSize) };
    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
};

export const toggleUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) throw new AppError(404, "USER_NOT_FOUND", "User not found");
    if (String(target._id) === req.user!.sub) throw new AppError(400, "SELF_ACTION_DENIED", "Cannot deactivate yourself");
    target.isActive = !target.isActive;
    await target.save();
    await audit(target, target.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", req.user!.sub);
    res.json({ success: true, data: toSafeObject(target) });
  } catch (err) {
    next(err);
  }
};

export const deleteUserController = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) throw new AppError(404, "USER_NOT_FOUND", "User not found");
    if (String(target._id) === req.user!.sub) throw new AppError(400, "SELF_ACTION_DENIED", "Cannot delete yourself");
    await target.deleteOne();
    await audit(target, "USER_DELETED", req.user!.sub);
    res.json({ success: true, data: { message: "User deleted" } });
  } catch (err) {
    next(err);
  }
};
