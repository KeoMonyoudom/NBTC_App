import { getPublicMinioUrl } from "./minio.url.js";

export const formatHeroSlider = (slider) => {
  if (!slider) return null;

  const obj = slider.toObject();

  if (obj.image?.filename && obj.image?.bucket) {
    obj.image.url = getPublicMinioUrl(obj.image.bucket, obj.image.filename);
  }

  return obj;
};

// export const formatHeroSliderWithStream = (slider) => {
//   if (!slider) return null;
//   return slider.toObject(); // returns all fields as-is
// };

export const formatHeroSliderWithStream = (slider) => ({
  _id: slider._id,
  title: slider.title,
  subtitle: slider.subtitle,
  link: slider.link,
  sort: slider.sort,
  isActive: slider.isActive,
  createdBy: slider.createdBy,
  updatedBy: slider.updatedBy,
  image: slider.image,
  imageUrl: `/hero-slider/${slider._id}`, // MUST return correct URL
});