import User from "../models/UserModel.js";


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


export { userRegister };
