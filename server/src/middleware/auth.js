import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/security.js";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;
  const cookieToken = req.cookies?.accessToken;
  const token = bearerToken || cookieToken;
  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
