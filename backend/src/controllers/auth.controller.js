import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password, userName } = req.body;
  console.log(req.body);

  try {
    if (!fullName || !email || !password || !userName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check for existing username
    const existingUserName = await User.findOne({ userName });
    if (existingUserName) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      userName,
      password: hashedPassword,
    });

    await newUser.save(); // Save before token

    // Generate token and send response
    generateToken(newUser._id, res);

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      userName: newUser.userName,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const updated = await User.findByIdAndUpdate(
      user._id,
      { 
        $inc: { loginCount: 1 }, 
        lastLogin: new Date() 
      },
      { new: true }  // return the updated doc
    );

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      profilePic: user.profilePic,
      lastLogin: updated.lastLogin,
      loginCount: updated.loginCount,
      createdAt: updated.createdAt,  
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      lastLogout: new Date(),
    });
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName } = req.body;
    const userId = req.user._id;

    const updateData = {};

    // If a profile picture is provided, upload it to Cloudinary
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    // If a new full name is provided, update it
    if (fullName) {
      updateData.fullName = fullName;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const checkAuth = async (req, res) => {
  try {
    // load fresh user
    const user = await User.findById(req.user._id).select("-password");

    // count messages sent
    const messagesSent = await Message.countDocuments({ senderId: user._id });

    res.status(200).json({
      _id:        user._id,
      fullName:   user.fullName,
      userName:   user.userName,
      email:      user.email,
      profilePic: user.profilePic,
      lastLogin:  user.lastLogin,
      lastLogout: user.lastLogout,
      loginCount: user.loginCount,
      messagesSent,
      createdAt:  user.createdAt,
    });
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const searchUsers = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username query is required" });
  }

  try {
    const users = await User.find({
      userName: { $regex: username, $options: "i" },
    }).select("-password");

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};