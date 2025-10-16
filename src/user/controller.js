const express = require("express");
const router = express.Router();
const { prisma } = require("../../utils/pisma");
const bcrypt = require("bcryptjs");

// Register User
const registerUser = async (req, res) => {
  const { name, userName, email, password } = req.body;
  try {
    if (!name || !email || !password || !userName) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    const existingUser = await prisma.user.findFirst({
      where: { userName, email, isActive: true },
    });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userName,
        isActive: true,
      },
    });
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error while registering user", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const editUser = async (req, res) => {
  try {
    const {
      id,
      name,
      email,
      userName,
      password,
      //isActive
    } = req.body;
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        NOT: { id },
      },
    });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        userName,
        password: hashedPassword,
        // isActive
      },
    });
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error while editing user", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false, status: 0 },
    });
    res.status(200).json({ message: "User deleted successfully", user });
  } catch (error) {
    console.error("Error while deleting user", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { registerUser, editUser, deleteUser };
