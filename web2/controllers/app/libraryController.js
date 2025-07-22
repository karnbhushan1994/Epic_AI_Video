import Category from '../../models/Category.js';
import Creation from '../../models/Creation.js';

export const libraryData = async function (req, res) {
  try {
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ message: "No active session found" });
    }

    const shop = session.shop;
    const type = req.query.type;

    // Build query filter
    const matchStage = {
      shopDomain: shop,
    };

    // Only filter by type if it's "image" or "video"
    if (type === "image" || type === "video") {
      matchStage.type = type;
    }

    // Aggregation pipeline
    const creations = await Creation.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "categories",
          localField: "templateId",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Format the response
    const mediaItems = creations.map(item => ({
      title: item.title || item.category?.name || "Untitled",
      taskId: item.taskId,
      id: item._id,
      description: item.description || item.category?.description || "No description available.",
      source: item.source,
      inputImages: item.inputMap,
      outputMap: item.outputMap,
      type: item.type,
      status: item.status,
       createdAt: item.createdAt,
      category: {
        name: item.category?.name || null,
      }
    }));

    return res.status(200).json({
      success: true,
      message: "Library data fetched successfully.",
      count: mediaItems.length,
      data: mediaItems
    });

  } catch (error) {
    console.error("Error in libraryData:", error);
    return res.status(500).json({
      success: false,
      message: "FAILED to fetch library data.",
      error: error.message
    });
  }
};
