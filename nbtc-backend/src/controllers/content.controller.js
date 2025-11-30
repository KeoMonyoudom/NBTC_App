import { ContentModel } from "../models/content.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";
import { minioClient } from "../minio/index.js";

export const createContent = async (req, res) => {
  try {
    const { title, description, sort, statement, list } = req.body;

    // Validate required fields
    if (!title || !statement) {
      return res.status(400).json({
        success: false,
        message: "Title and statement are required",
      });
    }

    // Convert list string → array
    const listArray =
      typeof list === "string" && list.trim() !== ""
        ? list.split(",").map((item) => item.trim())
        : [];

    // Process uploaded files (already provided by MinIO uploader)
    const images = Array.isArray(req.files)
      ? req.files.map((file) => ({
          filename: file.filename,
          originalname: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          encoding: file.encoding,
          bucket: file.bucket,
        }))
      : [];

    const newContent = await ContentModel.create({
      title,
      description: description || "",
      sort: Number(sort) || 0,
      createdBy: req.user._id,

      details: [
        {
          statement,
          list: listArray,
          images,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Content created successfully",
      data: newContent,
    });
  } catch (error) {
    console.error("CreateContent error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getContents = async (req, res) => {
  try {
    const MINIO_URL =
      process.env.MINIO_PUBLIC_URL ||
      `http://localhost:${process.env.MINIO_PORT || 9000}`;

    const result = await ContentModel.find().sort({ createdAt: -1 }).populate({
      path: "createdBy",
      select: "username fullName",
    });

    let contentId = "";
    let detailId = "";
    let imageId = "";

    const formatted = result.map((content) => {
      contentId = content._id;
      const details = content.details.map((det) => {
        detailId = det._id;
        const images = det.images.map((img) => ({
          ...img.toObject(),
          // url: `${MINIO_URL}/${img.bucket}/${img.filename}`,

          url: `/content/${contentId}/details/${detailId}/images/${img._id}`,
        }));

        return {
          ...det.toObject(),
          images,
        };
      });

      return {
        ...content.toObject(),
        details,
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("getContents error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// /**
//  * Get Content By ID
//  */
// export const getContentById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const content = await Content.findById(id).populate(
//       "createdBy updatedBy",
//       "fullName username"
//     );

//     if (!content || content.deleted)
//       return res.status(404).json({ message: "Content not found" });

//     return res.status(200).json({
//       message: "Content detail",
//       data: content,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Update Content
//  */
// export const updateContent = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const content = await Content.findById(id);

//     if (!content || content.deleted)
//       return res.status(404).json({ message: "Content not found" });

//     Object.assign(content, req.body);
//     content.updatedBy = req.user._id;

//     await content.save();

//     return res.status(200).json({
//       message: "Content updated successfully",
//       data: content,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Soft Delete Content
//  */
// export const deleteContent = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const content = await Content.findById(id);

//     if (!content || content.deleted)
//       return res.status(404).json({ message: "Content not found" });

//     content.deleted = true;
//     content.updatedBy = req.user._id;
//     content.updatedAt = new Date();

//     await content.save();

//     return res.status(200).json({
//       message: "Content deleted successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getContentImageByBucketAndFilename = async (req, res) => {
//   const { bucket, filename } = req.params;

//   if (!bucket || !filename) {
//     return errorResponse(res, 404, "File not found");
//   }
//   const fileStream = await minioClient.getObject(bucket, filename);

//   res.setHeader("Content-Type", mimetype || "image/jpeg");
//   res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
//   res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename="${originalname}"`
//   ); // 🟢 allow browser to display image

//   return fileStream.pipe(res);
// };

export const getContentImageById = async (req, res) => {
  try {
    const { contentId, detailId, imageId } = req.params;

    const content = await ContentModel.findById(contentId);
    if (!content) {
      return errorResponse(res, 404, "Content not found");
    }

    const detail = content.details.id(detailId);
    if (!detail) {
      return errorResponse(res, 404, "Detail not found");
    }

    const image = detail.images.id(imageId);
    if (!image) {
      return errorResponse(res, 404, "Image not found");
    }

    const { bucket, filename, mimetype, originalname } = image;

    // Fetch image from MinIO
    const fileStream = await minioClient.getObject(bucket, filename);

    // Headers for displaying inline or download
    res.setHeader("Content-Type", mimetype || "image/jpeg");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Content-Disposition", `inline; filename="${originalname}"`);

    return fileStream.pipe(res);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};

export const deleteContentById = async (req, res) => {
  try {
    const contentId = req.params.id;
    const content = await ContentModel.findById(contentId);
    if (!content) {
      return errorResponse(res, 404, "Content not found");
    }

    // content.map((content) => {
    //   content.details.map((det) => {
    //     det.images.map(async (img) => {
    //       await minioClient.removeObject(img.bucket, img.filename, {});
    //     });
    //   });
    // });

    if (content.details && Array.isArray(content.details)) {
      for (const det of content.details) {
        if (det.images && Array.isArray(det.images)) {
          // Use Promise.all to concurrently remove all images in this detail section
          const deletePromises = det.images.map(async (img) => {
            // Ensure image properties exist before attempting removal
            if (img.bucket && img.filename) {
              console.log(
                `Deleting MinIO object: ${img.bucket}/${img.filename}`
              );
              await minioClient.removeObject(img.bucket, img.filename, {});
            }
          });
          await Promise.all(deletePromises);
        }
      }
    }

    await ContentModel.deleteOne({ _id: content._id });

    return successResponse(res, 200, "File deleted successfully", null);
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error", error.message);
  }
};
