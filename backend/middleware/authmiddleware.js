import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied." });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) {
      return res.status(401).json({ message: "Token is not valid." });
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found, authorization denied" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({message: 'Token is not valid.'})
  }
};

export default verifyJWT;
