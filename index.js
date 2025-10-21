const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");

app.use(morgan("dev"))
app.use(cors());
dotenv.config();

const PORT = process.env.PORT || 3000;  // fallback port

// Import auth routes
const userRoutes = require("./src/user/route");
const authRoutes = require("./src/Auth/route");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Auth routes
app.use("/v1/api/user", userRoutes);
app.use("/v1/api/auth", authRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
