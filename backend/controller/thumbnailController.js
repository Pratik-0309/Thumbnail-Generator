import Thumbnail from "../models/ThumbnailModel.js";
import { HarmCategory, HarmBlockThreshold } from "@google/genai";
import geminiAI from "../config/gemini.js";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const stylePrompts = {
  "Bold & Graphic":
    "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style",
  "Tech/Futuristic":
    "futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",
  Minimalist:
    "minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",
  Photorealistic:
    "photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",
  Illustrated:
    "illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style",
};

const colorSchemeDescriptions = {
  vibrant:
    "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette",
  sunset:
    "warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow",
  forest:
    "natural green tones, earthy colors, calm and organic palette, fresh atmosphere",
  neon: "neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow",
  purple:
    "purple-dominant color palette, magenta and violet tones, modern and stylish mood",
  monochrome:
    "black and white color scheme, high contrast, dramatic lighting, timeless aesthetic",
  ocean:
    "cool blue and teal tones, aquatic color palette, fresh and clean atmosphere",
  pastel:
    "soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic",
};

const generateThumbnail = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
    } = req.body;

    const thumbnail = await Thumbnail.create({
      user: userId,
      title,
      prompt_used: user_prompt,
      user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
      isGenerating: true,
    });

    const model = geminiAI.getGenerativeModel({ model: "imagen-3" });

    const generationConfig = {
      maxOutputTokens: 32878,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspect_ratio || "16:9",
        imageSize: "1K",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    let prompt = `create a ${stylePrompts[style]} for : ${title}`;

    if (color_scheme) {
      prompt += `Use a ${colorSchemeDescriptions[color_scheme]} color scheme.`;
    }

    if (user_prompt) {
      prompt += `Additional details: ${user_prompt}`;
    }

    prompt += `The thumbnail should be ${aspect_ratio}, visually stunnig, and designed to maximize click-through rate.
    Make it bold, professional, and impossible to ignore.`;

    const response = await geminiAI.models.generateContent({
      model,
      contents: [prompt],
      config: generationConfig,
    });

    if (!response?.candidates?.[0]?.content?.parts) {
      throw new error("Unexpected response");
    }

    const parts = response.candidates[0].content.parts;

    let finalBuffer;
    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    const filename = `final-output-${Date.now()}.png`;
    const filePath = path.join("images", filename);

    // create image directory if not exist
    fs.mkdirSync("images", { recursive: true });

    // Write final image to file
    fs.writeFileSync(filePath, finalBuffer);

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
    });

    thumbnail.image_url = uploadResult;
    thumbnail.isGenerating = false;
    await thumbnail.save();

    return res.status(200).json({
      thumbnail,
      success: true,
      message: "Thumbnail Generated Successfully.",
    });

    fs.unlinkSync(filePath);
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate thumbnail." });
  }
};

const deleteThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const thumbnail = await Thumbnail.findById(id);
    if (!thumbnail) {
      return res
        .status(404)
        .json({ success: false, message: "Thumbnail not found" });
    }

    if (thumbnail.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this thumbnail",
      });
    }

    if (thumbnail.image_url) {
      const publicId = thumbnail.image_url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Thumbnail.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Thumbnail deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete thumbnail." });
  }
};

const getUserThumnail = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }

    const thumbnails = await Thumbnail.find({ user: userId }).sort({ createdAt: -1 });
    if (!thumbnails) {
      return res
        .status(404)
        .json({ success: false, message: "Thumbnails not found." });
    }

    return res.status(200).json({
      thumbnails,
      success: true,
      message: "Thumbnail fetched Successfully.",
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch thumbnail." });
  }
};

export { generateThumbnail, deleteThumbnail, getUserThumnail };
