// utils/dbHelpers.js
export const deleteById = async (Model, id) => {
  try {
    const deletedDoc = await Model.findByIdAndDelete(id);

    if (!deletedDoc) {
      return {
        status: 404,
        success: false,
        message: "Document not found",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Deleted successfully",
      data: deletedDoc,
    };
  } catch (error) {}
};

export const updateById = async (Model, id, updateData, options = {}) => {
  const updatedDoc = await Model.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
    ...options,
  });

  if (!updatedDoc) {
    return {
      status: 404,
      success: false,
      message: "Document not found",
    };
  }

  return {
    status: 200,
    success: true,
    message: "Updated successfully",
    data: updatedDoc,
  };
};
