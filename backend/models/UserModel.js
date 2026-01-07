import mongoose, { Mongoose } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    refreshToken: {
      type: String,
    },
  },
  { timeStamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return null;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password);
};

userSchema.methods.generateAccessToken = function(){
   return jwt.sign({
    _id: this._id,
    email: this.email
  }, process.env.ACCESS_TOKEN_SECRET ,{
    expiresIn: '15m'
  });
};

userSchema.methods.generateRefreshToken = function(){
   return jwt.sign({
    _id: this._id,
  }, process.env.REFRESH_TOKEN_SECRET ,{
    expiresIn: '7d'
  });
};


const User = mongoose.model("User", userSchema);

export default User;
