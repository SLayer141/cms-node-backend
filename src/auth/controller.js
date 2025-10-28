const express = require("express");
const router = express.Router();
const { prisma } = require("../../utils/prisma");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../../utils/jwt");

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        status: 1,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Remove password from user object before generating token
    const { password: _, ...userForToken } = user;
    console.log(userForToken);

    const token = generateToken(userForToken);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error while logging in user", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { loginUser };
