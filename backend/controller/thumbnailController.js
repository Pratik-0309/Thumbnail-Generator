import Thumbnail from "../models/ThumbnailModel.js";
import path from "path";
import fs from "fs";
import { createCanvas, loadImage } from "canvas";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";

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
  let filePath = "";

  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio = "16:9",
      color_scheme,
      text_overlay = true,
    } = req.body;

    if (!title || !style) {
      return res.status(400).json({
        success: false,
        message: "Title and style are required",
      });
    }

    let prompt = `
Create a professional YouTube thumbnail background.
Topic: "${title}"
Style: ${stylePrompts?.[style] || style}.
`;

    if (color_scheme) {
      prompt += `
Color scheme: ${colorSchemeDescriptions?.[color_scheme] || color_scheme}.
`;
    }

    if (user_prompt) {
      prompt += `
Additional details: ${user_prompt}.
`;
    }

    prompt += `
Do NOT include any text, letters, words, watermark, logo.
Leave clean empty space for text overlay.
Ultra sharp, cinematic lighting, high contrast.
`;

    const dims =
      aspect_ratio === "16:9"
        ? { w: 1280, h: 720 }
        : aspect_ratio === "9:16"
        ? { w: 720, h: 1280 }
        : { w: 1024, h: 1024 };

    const seed = Math.floor(Math.random() * 1000000);

    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?width=${dims.w}&height=${dims.h}&seed=${seed}&model=flux&nologo=true`;

    const aiResponse = await axios.get(pollinationsUrl, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(aiResponse.data, "binary");

    if (!fs.existsSync("images")) fs.mkdirSync("images", { recursive: true });

    const filename = `thumb-${Date.now()}.png`;
    filePath = path.join("images", filename);
    fs.writeFileSync(filePath, buffer);

    if (text_overlay) {
      const image = await loadImage(filePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(image, 0, 0);

      /* ---------- SAFE AREA ---------- */
      const safeMarginX = image.width * 0.06;
      const maxTextWidth = image.width - safeMarginX * 2;

      /* ---------- TITLE SPLIT ---------- */
      const words = title.toUpperCase().split(" ");
      let lines = [];
      let currentLine = "";

      let fontSize = Math.floor(image.width * 0.075);
      ctx.font = `bold ${fontSize}px sans-serif`;

      for (let word of words) {
        const testLine = currentLine + word + " ";
        if (ctx.measureText(testLine).width > maxTextWidth) {
          lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine.trim());

      // Max 2 lines only (YouTube rule)
      if (lines.length > 2) {
        lines = [
          lines[0],
          lines.slice(1).join(" ").split(" ").slice(0, 3).join(" "),
        ];
      }

      /* ---------- AUTO SCALE ---------- */
      while (
        Math.max(...lines.map((l) => ctx.measureText(l).width)) > maxTextWidth
      ) {
        fontSize -= 3;
        ctx.font = `bold ${fontSize}px sans-serif`;
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      /* ---------- TEXT STYLE ---------- */
      ctx.lineWidth = Math.max(4, fontSize * 0.12);
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";

      /* ---------- POSITION ---------- */
      const centerX = image.width / 2;
      const centerY = image.height * 0.75;
      const lineHeight = fontSize * 1.15;

      lines.forEach((line, i) => {
        const y = centerY + (i - (lines.length - 1) / 2) * lineHeight;

        ctx.strokeText(line, centerX, y);
        ctx.fillText(line, centerX, y);
      });

      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
    }

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: "thumbnails",
    });

    fs.unlinkSync(filePath);

    const thumbnail = await Thumbnail.create({
      user: userId,
      title,
      image_url: uploadResult.secure_url,
      prompt_used: prompt,
      user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
      isGenerating: false,
    });

    return res.status(200).json({
      success: true,
      message: "Thumbnail generated successfully",
      thumbnail,
    });
  } catch (error) {
    console.error("Thumbnail generation error:", error);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate thumbnail",
    });
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

    const thumbnails = await Thumbnail.find({ user: userId }).sort({
      createdAt: -1,
    });
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

const getSingleThumbnail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const thumbnail = await Thumbnail.findById(id);
    if (!thumbnail) {
      return res.status(404).json({
        success: false,
        message: "Thumbnail not found.",
      });
    }

    if (thumbnail.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this thumbnail.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Thumbnail fetch Successfully.",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      thumbnail,
      success: false,
      message: "Failed to fetch thumbnail.",
    });
  }
};

export {
  generateThumbnail,
  deleteThumbnail,
  getUserThumnail,
  getSingleThumbnail,
};
