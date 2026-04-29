import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  try {
    const res = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4", {
      resource_type: "video",
      eager: [
        { width: 720, height: 1280, crop: "fill", gravity: "auto", effect: "preview:duration_15", quality: "auto:eco", fetch_format: "mp4" }
      ],
      eager_async: true
    });
    console.log("Full Res:", JSON.stringify(res.eager, null, 2));
  } catch (err) {
    console.error(err);
  }
})();