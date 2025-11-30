export const buildPaginationOptions = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  let sort = { createdAt: -1 }; // default sort: newest first

  if (req.query.sort) {
    sort = {};
    req.query.sort.split(",").forEach((rule) => {
      const [field, direction] = rule.split(":").map((x) => x.trim());
      sort[field] = direction === "asc" ? 1 : -1;
    });
  }

  return { page, limit, sort, lean: true };
};

//example use:
// const result = await ContentModel.paginate(query, options);

// return res.status(200).json({
//   message: "Contents retrieved",
//   pagination: {
//     totalDocs: result.totalDocs,
//     page: result.page,
//     limit: result.limit,
//     totalPages: result.totalPages,
//     hasNextPage: result.hasNextPage,
//     hasPrevPage: result.hasPrevPage,
//   },
//   data: result.docs,
// });
