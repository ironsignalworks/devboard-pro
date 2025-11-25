import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
