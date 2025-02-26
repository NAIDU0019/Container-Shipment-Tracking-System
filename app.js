import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
import cron from "node-cron";

cron.schedule("0 * * * *", async () => { // Runs every hour
  console.log("Checking for expired bookings...");

  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() - 2); // 2 hours expiry

  const { data, error } = await supabase
    .from("containers")
    .update({ status: "cancelled", booked_by: null })
    .lt("created_at", expiryTime.toISOString()) // Expired bookings
    .eq("status", "pending");

  if (error) {
    console.error("Error auto-cancelling bookings:", error);
  } else {
    console.log("Expired bookings cancelled:", data.length);
  }
});


// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!["Trader", "LSP"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role. Choose 'Trader' or 'LSP'." });
    }

    // ✅ Check if email already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered. Please log in." });
    }

    // ✅ Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save User to Supabase
    const { data, error } = await supabase
  .from("users")
  .insert([{ email, password: hashedPassword, role, verified: false }])
  .select();

    if (error) throw error;

    res.status(201).json({ success: true, message: "User registered!", user: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Login route


// Login User
app.post("/api/auth/login", async (req, res) => {
  try {
      const { email, password } = req.body;
      const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      
      const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ success: true, message: "Login successful!", token, user });
  } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
  }
});
// Middleware to Verify Token


// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ success: false, message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ Use process.env.JWT_SECRET
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

app.post("/api/users/approve/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "LSP") {
    return res.status(403).json({ success: false, message: "Only LSPs can approve Traders" });
  }

  try {
    const traderId = req.params.id.trim(); // ✅ Trim UUID to remove unwanted characters

    // ✅ Update Trader's verification status
    const { data, error } = await supabase
      .from("users")
      .update({ verified: true })
      .eq("id", traderId)
      .eq("role", "Trader")
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: "Trader not found or already verified" });
    }

    res.json({ success: true, message: "Trader approved!", user: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Approval failed", error: error.message });
  }
});

// ✅ Get All Containers
app.get("/api/containers", verifyToken, async (req, res) => {
  try {
      const { data, error } = await supabase.from("containers").select("*");
      if (error) throw error;
      res.json({ success: true, containers: data });
  } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching containers" });
  }
});


/// 📌 1️⃣ BOOK A CONTAINER (Set `pending` status)
// Set max limit (e.g., 5)
const MAX_BOOKINGS_PER_TRADER = 5;
app.post("/api/containers/book", verifyToken, async (req, res) => {
  if (req.user.role !== "Trader" || req.user.verified) {
    return res.status(403).json({ success: false, message: "Only verified Traders can book containers." });
  }

  try {
    const { container_id } = req.body;

    // ✅ Check if the container exists and is available
    const { data: container, error: checkError } = await supabase
      .from("containers")
      .select("id, status")
      .eq("id", container_id)
      .single();

    if (checkError || !container) return res.status(400).json({ success: false, message: "Container not found" });

    if (container.status !== "available") {
      return res.status(400).json({ success: false, message: "Container is already booked" });
    }

    // ✅ Book the container (update `booked_by`, `status`, and `booked_at`)
    const { data, error } = await supabase
      .from("containers")
      .update({
        booked_by: req.user.userId,
        status: "pending",
        booked_at: new Date().toISOString(),
      })
      .eq("id", container_id)
      .eq("status", "available") // Prevents double booking
      .select();

    if (error) throw error;

    res.json({ success: true, message: "Container booked as pending!", container: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Booking failed", error: error.message });
  }
});



// 📌 2️⃣ CONFIRM BOOKING (Set `confirmed` status)
app.post("/api/containers/confirm", verifyToken, async (req, res) => {
  if (req.user.role !== "Trader") {
    return res.status(403).json({ success: false, message: "Only Traders can confirm bookings" });
  }

  try {
    const { container_id } = req.body;

    const { data, error } = await supabase
      .from("containers")
      .update({ status: "confirmed" })
      .eq("id", container_id)
      .eq("booked_by", req.user.userId)
      .eq("status", "pending")
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(400).json({ success: false, message: "Invalid booking confirmation" });

    res.json({ success: true, message: "Booking confirmed!", container: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Confirmation failed", error: error.message });
  }
});

// 📌 3️⃣ CANCEL BOOKING (Reset `available` status)
app.post("/api/containers/cancel", verifyToken, async (req, res) => {
  if (req.user.role !== "Trader") {
    return res.status(403).json({ success: false, message: "Only Traders can cancel bookings" });
  }

  try {
    const { container_id } = req.body;

    const { data, error } = await supabase
      .from("containers")
      .update({ booked_by: null, booked_at: null, status: "available" })
      .eq("id", container_id)
      .eq("booked_by", req.user.userId)
      .eq("status", "pending")
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(400).json({ success: false, message: "Invalid cancellation request" });

    res.json({ success: true, message: "Booking canceled!", container: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Cancellation failed", error: error.message });
  }
});

// 📌 4️⃣ AUTO-CANCEL UNCONFIRMED BOOKINGS (After 24 hours)
app.post("/api/containers/auto-cancel", async (req, res) => {
  try {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - 24);
    const utcTime = expiryTime.toISOString(); // Convert to UTC

    const { data, error } = await supabase
      .from("containers")
      .update({ status: "available", booked_by: null, booked_at: null })
      .eq("status", "pending")
      .lt("booked_at", utcTime)
      .select();

    if (error) throw error;

    res.json({ success: true, message: "Expired bookings canceled!", affected_rows: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Auto-cancel failed", error: error.message });
  }
});
// 📌 5️⃣ LIST ALL CONTAINERS WITH STATUS
app.get("/api/containers", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("containers")
      .select("id, name, status, booked_by, booked_at");

    if (error) throw error;

    res.json({ success: true, containers: data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch containers", error: error.message });
  }
});


// 🚀 LSP: Add a Container
app.post("/api/containers", verifyToken, async (req, res) => {
  if (req.user.role !== "LSP") {
    return res.status(403).json({ success: false, message: "Only LSPs can add containers" });
  }

  try {
    const { name, capacity } = req.body;
    const lspId = req.user.userId.trim(); // ✅ Ensure LSP ID is correctly formatted

    // ✅ Ensure the LSP exists in the users table
    const { data: lspExists, error: lspError } = await supabase
      .from("users")
      .select("id")
      .eq("id", lspId)
      .eq("role", "LSP")
      .single();

    if (!lspExists) {
      return res.status(400).json({ success: false, message: "LSP does not exist. Please register first." });
    }

    // ✅ Insert container with valid LSP ID
    const { data, error } = await supabase
      .from("containers")
      .insert([{ name, capacity, status: "available", created_by: lspId }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, message: "Container added successfully!", container: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Container addition failed", error: error.message });
  }
});



// 🚀 LSP: Update a Container
app.put("/api/containers/update/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "LSP") {
    return res.status(403).json({ success: false, message: "Only LSPs can update containers" });
  }

  try {
    const { id } = req.params;
    const { name, availability } = req.body;

    const { data, error } = await supabase
      .from("containers")
      .update({ name, availability })
      .eq("id", id)
      .eq("lsp_id", req.user.userId)
      .select();

    if (error) throw error;

    res.json({ success: true, message: "Container updated!", container: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
});


// 🚀 LSP: Delete a Container
app.delete("/api/containers/delete/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "LSP") {
    return res.status(403).json({ success: false, message: "Only LSPs can delete containers" });
  }

  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("containers")
      .delete()
      .eq("id", id)
      .eq("lsp_id", req.user.userId);

    if (error) throw error;

    res.json({ success: true, message: "Container deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// 🚀 AI Model Suggestion Endpoint
app.post("/api/ai/suggest-container", verifyToken, async (req, res) => {
  if (req.user.role !== "Trader") {
    return res.status(403).json({ success: false, message: "Only Traders can access AI suggestions" });
  }

  try {
    const { cargoType, destination } = req.body;

    // Simulated AI logic: Fetch available containers based on cargo type and destination
    const { data, error } = await supabase
      .from("containers")
      .select("*")
      .eq("availability", true);

    if (error) throw error;

    // Simulate AI model processing (Modify this to call your actual AI model)
    const recommendedContainers = data.slice(0, 3); // AI selects top 3

    res.json({
      success: true,
      message: "AI container recommendations",
      recommendations: recommendedContainers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "AI processing failed" });
  }
});

app.post("/api/users/approve/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "LSP") return res.status(403).json({ success: false, message: "Only LSPs can approve Traders" });

  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("users").update({ verified: true }).eq("id", id).select();
    if (error) throw error;

    res.json({ success: true, message: "Trader approved!", user: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Approval failed", error: error.message });
  }
});
//lsp analytics 


app.get("/api/lsp/analytics", verifyToken, async (req, res) => {
  if (req.user.role !== "LSP") {
    return res.status(403).json({ success: false, message: "Only LSPs can access analytics" });
  }

  try {
    const { userId } = req.user;

    // ✅ Count available containers
    const { count: availableCount, error: availableError } = await supabase
      .from("containers")
      .select("*", { count: "exact" })
      .eq("created_by", userId)
      .eq("status", "available");

    if (availableError) throw availableError;

    // ✅ Count pending bookings
    const { count: pendingCount, error: pendingError } = await supabase
      .from("containers")
      .select("*", { count: "exact" })
      .eq("created_by", userId)
      .eq("status", "pending");

    if (pendingError) throw pendingError;

    // ✅ Count confirmed bookings
    const { count: confirmedCount, error: confirmedError } = await supabase
      .from("containers")
      .select("*", { count: "exact" })
      .eq("created_by", userId)
      .eq("status", "confirmed");

    if (confirmedError) throw confirmedError;

    // ✅ Total bookings (pending + confirmed)
    const totalBookings = pendingCount + confirmedCount;

    res.json({
      success: true,
      message: "LSP Analytics fetched",
      containerStats: {
        available: availableCount,
        pending: pendingCount,
        confirmed: confirmedCount
      },
      totalBookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Analytics fetch failed", error: error.message });
  }
});



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});