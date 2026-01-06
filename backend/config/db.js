import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose
      .connect(`${process.env.MONGO_URI}`)
      .then(() => {
        console.log("MongoDB Connected Successfully");
      })
      .catch((error) => {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
      });
  } catch (error) {
    console.log("MongoDB connection error: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
