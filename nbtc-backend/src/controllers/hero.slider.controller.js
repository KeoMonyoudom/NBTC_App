import { minioClient } from "../minio/index.js";
import { HeroSliderModel } from "../models/hero.slider.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";
import { formatHeroSliderWithStream } from "../utils/minio.formatter.js";

export const getHeroSliders = async (req, res) => {
  try {
    const sliders = await HeroSliderModel.find()
      .sort({ sort: 1 })
      .populate({ path: "createdBy", select: "username fullName -_id" });
    const data = sliders.map(formatHeroSliderWithStream);
    // res.status(200).json({ success: true, count: data.length, data });
    return successResponse(res, 200, "Data retrieved successfully", data);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};

// export const uploadSingleFile = async (req, res) => {
//   const file = req.file;
//   const newFile = new HeroSliderModel(file);
//   await newFile.save();
//   res.json(file);
// };

// export const uploadMultiple = async (req, res) => {
//   const files = req.files;
//   if (!files || files.length === 0) {
//     return res.status(400).json({ message: "No files uploaded" });
//   }
//   // console.log(files)
//   const heroSliderModels = files.map((file) => new HeroSliderModel(file));
//   await Promise.all(
//     heroSliderModels.map((HeroSliderModel) => HeroSliderModel.save())
//   );
//   res.json(files);
// };

export const createHeroSlider = async (req, res) => {
  try {
    const { title, subtitle, link, sort } = req.body;

    const image = req.file
      ? {
          filename: req.file.filename,
          originalname: req.file.originalname,
          path: req.file.path,
          mimetype: req.file.mimetype,
          encoding: req.file.encoding,
          bucket: req.file.bucket,
        }
      : null;

    const slider = await HeroSliderModel.create({
      title,
      subtitle,
      link,
      sort,
      image,
      createdBy: req.user._id,
    });
    return successResponse(
      res,
      201,
      "Hero Slider created successfully",
      slider
    );
  } catch (err) {
    return errorResponse(res, 500, "Internal Server Error", err.message);
  }
};

export const getHeroSliderById = async (req, res) => {
  const fileId = req.params.id;
  const file = await HeroSliderModel.findById(fileId);
  if (!file) {
    return errorResponse(res, 404, "File not found");
  }
  const { bucket, filename, mimetype, originalname } = file.image;

  const fileStream = await minioClient.getObject(bucket, filename);

  res.setHeader("Content-Type", mimetype || "image/jpeg");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${originalname}"`
  ); // 🟢 allow browser to display image

  return fileStream.pipe(res);
};

export const deleteFileById = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await HeroSliderModel.findById(fileId);
    if (!file) {
      return errorResponse(res, 404, "File not found");
    }

    const { bucket, filename } = file.image;

    await HeroSliderModel.deleteOne({ _id: file._id });
    await minioClient.removeObject(bucket, filename, {});
    return successResponse(res, 200, "File deleted successfully", null);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};
