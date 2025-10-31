let express = require("express");
let app = express();
const cors = require("cors");
const mongoose = require("mongoose");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Server start
app.listen(3030, () => {
  console.log("server is working on port 3030");
});

// ✅ MongoDB connection
main()
  .then(() => console.log("database has been connected"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/shedb");
}

// ✅ Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("users", userSchema);
const threatSchema = new mongoose.Schema({
  username: { type: String, required: true }, // who reported it
  location: { type: String, required: true },
  threatType: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, required: true },
  contact: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Threat = mongoose.model("threats", threatSchema);

const bookingSchema = new mongoose.Schema({
  username: { type: String, required: true },
  shelterName: { type: String, required: true },
  date: { type: String, required: true },
  bookedAt: { type: Date, default: Date.now },
});
const Booking = mongoose.model("bookings", bookingSchema);


// ✅ LOGIN Route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .json({ success: false, message: "Please enter both username and password" });

    // Allow login using either username or email
    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found. Please register." });

    if (user.password !== password)
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });

    return res.json({ success: true, message: "Login successful!" });
  } catch (err) {
    console.error("Error in login:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ REGISTER Route
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists. Please login." });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    // ✅ Respond with JSON (not EJS)
    res.json({
      success: true,
      message: "Registration successful! Please login.",
    });
  } catch (err) {
    console.error("Error in registration:", err);
    res
      .status(500)
      .json({ success: false, message: "Error occurred during registration" });
  }
});

app.post("/report-threat", async (req, res) => {
  try {
    const { username, location, threatType, description, urgency, contact } = req.body;

    if (!username || !location || !threatType || !description || !urgency) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newThreat = new Threat({
      username,
      location,
      threatType,
      description,
      urgency,
      contact,
    });

    await newThreat.save();

    res.json({ success: true, message: "Threat report saved successfully!" });
  } catch (err) {
    console.error("Error saving threat:", err);
    res.status(500).json({ success: false, message: "Error saving threat report" });
  }
});

// ✅ Shelter booking route
app.post("/book-shelter", async (req, res) => {
  try {
    const { username, shelterName, date } = req.body;

    if (!username || !shelterName || !date) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const booking = new Booking({ username, shelterName, date });
    await booking.save();

    console.log(`✅ ${username} booked ${shelterName} for ${date}`);
    res.json({ success: true, message: "Booking successful!" });
  } catch (err) {
    console.error("Error booking shelter:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


