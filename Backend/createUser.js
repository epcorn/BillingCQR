import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/BillingUser.js"; // adjust path if needed

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const name = "chirag";
    const email = "chirag@epcorn.com";
    const password = "123456"; // plaintext!
    const role = "admin";

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("❌ User already exists with that email");
      process.exit(0);
    }

    const user = await User.create({
      name,
      email,
      password, // <-- do NOT hash manually
      role,
    });

    console.log("✅ User created successfully:");
    console.log({
      name: user.name,
      email: user.email,
      role: user.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user:", error);
    process.exit(1);
  }
};

createUser();
