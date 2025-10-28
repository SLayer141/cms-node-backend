const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user data exists (set by verifyToken middleware)
      if (!req.user) {
        return res.status(401).json({
          message: "User not authenticated",
          error: "MISSING_USER_DATA",
        });
      }

      const { role } = req.user;

      // Check if role exists in token
      if (!role) {
        return res.status(401).json({
          message: "Role not found in token",
          error: "MISSING_ROLE",
        });
      }

      // Check if user's role is authorized
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          message: "Insufficient permissions",
          error: "UNAUTHORIZED_ROLE",
          userRole: role,
          requiredRoles: allowedRoles,
        });
      }

      // Role is authorized, proceed
      next();
    } catch (error) {
      console.error("Role verification error:", error.message);
      res.status(500).json({
        message: "Server Error",
        error: "ROLE_VERIFICATION_FAILED",
      });
    }
  };
};

module.exports = verifyRole;
    