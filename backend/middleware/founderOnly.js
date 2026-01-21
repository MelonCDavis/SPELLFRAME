const FOUNDER_USER_ID = "695b145daa8f82590be90e8d";

module.exports = function founderOnly(req, res, next) {
  if (!req.user?._id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user._id.toString() !== FOUNDER_USER_ID) {
    return res.status(403).json({ error: "Founder access only" });
  }

  next();
};
