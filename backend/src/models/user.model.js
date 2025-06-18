import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, 
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    lastSeen: {
      type: Date,
      default: Date.now, // Set current time by default
    },
    lastLogin:   { type: Date },
    lastLogout:  { type: Date },
    loginCount:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
