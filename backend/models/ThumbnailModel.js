import mongoose, { Schema } from "mongoose";

const thumbnailSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    style: {
      type: String,
      required: true,
      enum: [
        "Bold & Graphic",
        "Tech/Futuristic",
        "Minimalist",
        "Photorealistic",
        "Illustrated",
      ],
    },
    aspect_ratio: {
      type: String,
      required: true,
      enum: ["16:9", "1:1", "9:16"],
      default: "16:9",
    },
    color_scheme: {
      type: String,
      required: true,
      enum: [
        "vibrant",
        "sunset",
        "forest",
        "neon",
        "purple",
        "monochrome",
        "ocean",
        "pastel",
      ],
    },
    text_overlay: {
      type: Boolean,
      default: false
    },
    image_url: {
      type: String,
      default: ''
    },
    prompt_used: {
      type: String,
    }, 
    user_prompt: {
      type: String,
    },
    isGenerating: {
      type: Boolean,
      default: true
    },
  },
  { timestamps: true }
);

const Thumbnail = mongoose.model("Thumbnail", thumbnailSchema);

export default Thumbnail;
