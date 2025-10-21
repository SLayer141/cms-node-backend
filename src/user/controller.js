const express = require("express");
const router = express.Router();
const { prisma } = require("../../utils/pisma");
const bcrypt = require("bcryptjs");

// Register User
const registerUser = async (req, res) => {
  const { name, userName, email, password, role } = req.body;
  try {
    if (!name || !email || !password || !userName || !role) {
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
        role,
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
      role,
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
        role,
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

const viewUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    res.status(200).json({ message: "User fetched successfully", user });
  } catch (error) {
    console.error("Error while fetching user", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const listUser = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      search = "",
      toDate,
      fromDate,
      sortBy = "id",
      sortOrder = "DESC",
      role = "",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build dynamic WHERE conditions
    let whereConditions = [`"isActive" = true`]; // Start with base condition
    let queryParams = [];
    let paramCount = 0;

    // Search functionality - Cast role to text for ILIKE operations
    if (search && search.trim() !== "") {
      paramCount++;
      whereConditions.push(
        `(email ILIKE $${paramCount} OR name ILIKE $${paramCount} OR "userName" ILIKE $${paramCount} OR role::text ILIKE $${paramCount})`
      );
      queryParams.push(`%${search}%`);
    }

    // Role filtering - cast enum to text for comparison
    if (role && role.trim() !== "") {
      paramCount++;
      whereConditions.push(`role::text = $${paramCount}`);
      queryParams.push(role.toUpperCase());
    }

    // Date range filtering
    if (fromDate) {
      paramCount++;
      whereConditions.push(`"createdAt" >= $${paramCount}`);
      queryParams.push(new Date(fromDate));
    }

    if (toDate) {
      paramCount++;
      whereConditions.push(`"createdAt" <= $${paramCount}`);
      queryParams.push(new Date(toDate));
    }

    // Combine WHERE conditions - always has at least the isActive condition
    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Validate sortBy to prevent SQL injection
    const allowedSortColumns = [
      "id",
      "email",
      "name",
      "userName",
      "createdAt",
      "updatedAt",
      "role",
      "status",
    ];
    let validSortBy;

    // Special handling for role sorting (cast to text)
    if (sortBy === "role") {
      validSortBy = "role::text";
    } else {
      validSortBy = allowedSortColumns.includes(sortBy) ? `"${sortBy}"` : "id";
    }

    const validSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : "DESC";

    // Add limit and offset parameters
    paramCount++;
    const limitParam = paramCount;
    queryParams.push(parseInt(limit));

    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(offset);

    // Main query with pagination
    const usersQuery = `
      SELECT 
        id,
        email,
        name,
        "userName",
        role,
        "isActive",
        status,
        "createdAt",
        "updatedAt"
      FROM "User"
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Count query for total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "User"
      ${whereClause}
    `;

    console.log("Generated Query:", usersQuery);
    console.log("Query Parameters:", queryParams);

    // Execute queries
    const [users, totalResult] = await Promise.all([
      prisma.$queryRawUnsafe(usersQuery, ...queryParams),
      prisma.$queryRawUnsafe(countQuery, ...queryParams.slice(0, -2)),
    ]);

    const total = parseInt(totalResult[0].total);
    const totalPages = Math.ceil(total / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage,
        totalPages,
        totalRecords: total,
        limit: parseInt(limit),
        offset,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
      filters: {
        search: search || null,
        role: role || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.log("Error while listing users", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { registerUser, editUser, deleteUser, viewUser, listUser };
