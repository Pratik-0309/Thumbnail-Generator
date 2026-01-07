import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found, Invalid userId." });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    if (!accessToken || !refreshToken) {
      throw new Error(
        "Token generation failed — missing return in schema methods?"
      );
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Failed to generate token.",
    });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        message: "Refresh token is missing or unauthorized.",
      });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid user ID found in refresh token." });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(401).json({
        message: "Refresh Token is Expired or Used (Logout required).",
      });
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        message: "Access token refreshed successfully",
      });
  } catch (error) {
    console.error("Token refresh failed:", error);

    return res
      .status(401)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({ message: "Could not refresh token. Please log in again." });
  }
};

const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(403).json({
        success: false,
        message: "Please provide required feilds.",
      });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(402).json({
        success: false,
        message: "User with this email already exist.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      return res.status(200).json({
        user,
        success: true,
        message: "User register Successfully.",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid user data.",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};




export { userRegister, refreshAccessToken };
