import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

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

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide required feild",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid password.",
      });
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        message: "Welcome back!",
        user: loggedInUser,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const userLogout = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: "" });
    }

    return res
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error while logging out" });
  }
};

const getUserDetails = async(req,res) => {
  try {
    const userId = req.user._id;
    if(!userId){
      return res.status(403).json({
        message: "User Not found",
        success: true
      })
    }

    const user = await User.findById(userId);
     
    return res.status(200).json({
      success: true,
      message: "User fetched Successfully",
      user,
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "failed to fetch user detail.",
      success: false,
    })
  }
}

export { userLogin, userLogout, userRegister, refreshAccessToken,getUserDetails };
