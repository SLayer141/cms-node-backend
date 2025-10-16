const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  // Use a secret key from environment variables
  return jwt.sign(
    { id: user.id, email: user.email }, // payload: customize as needed
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // token expiry
  );
};

module.exports = { generateToken };
