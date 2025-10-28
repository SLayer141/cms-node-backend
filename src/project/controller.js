const upload = require("../../utils/fileUpload");
const express = require("express");
const prisma = require("../utils/prisma");

const app = express();

const addProject = async (req, res) => {
  try {
    // Handle file upload first
    upload.single("file")(req, res, async function (err) {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          message: "Error uploading file",
          error: err.message,
        });
      }

      try {
        // Extract fields from request body
        const { userId, title, semester, link } = req.body;

        // Validate required fields
        if (!userId || !title) {
          return res.status(400).json({
            message: "Missing required fields",
            required: ["userId", "title"],
          });
        }

        // Convert userId to integer
        const userIdInt = parseInt(userId);

        // Verify user exists
        const userExists = await prisma.user.findUnique({
          where: { id: userIdInt },
        });

        if (!userExists) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        // Prepare project data
        const projectData = {
          title,
          semester: semester || null,
          link: link || null,
          userId: userIdInt,
          createdBy: req.user?.id || userIdInt, // From JWT middleware
          updatedBy: req.user?.id || userIdInt,
        };

        // Add file information if file was uploaded
        if (req.file) {
          projectData.filePath = req.file.path;
          projectData.fileName = req.file.originalname;
          projectData.fileSize = req.file.size;
          projectData.mimeType = req.file.mimetype;
        }

        // Create project in database
        const newProject = await prisma.project.create({
          data: projectData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                userName: true,
              },
            },
            createdByUser: {
              select: {
                id: true,
                name: true,
                userName: true,
              },
            },
          },
        });

        // Success response
        res.status(201).json({
          message: "Project created successfully",
          project: newProject,
          fileUploaded: !!req.file,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);

        // Handle Prisma-specific errors
        if (dbError.code === "P2002") {
          return res.status(400).json({
            message: "Project with this title already exists for this user",
          });
        }

        if (dbError.code === "P2003") {
          return res.status(400).json({
            message: "Invalid user ID provided",
          });
        }

        res.status(500).json({
          message: "Error creating project",
          error: "DATABASE_ERROR",
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: "UNEXPECTED_ERROR",
    });
  }
};

module.exports = { addProject };
