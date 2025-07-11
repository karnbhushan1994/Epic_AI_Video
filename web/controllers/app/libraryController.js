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

    if (type === "image" || type === "video") {
      matchStage.type = type;
    }

    // Aggregation pipeline
    const creations = await Creation.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: "categories",            // MongoDB collection name
          localField: "templateId",      // field in Creation
          foreignField: "_id",           // primary key in Category
          as: "category"
        }
      },

      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true, // keep even if no category
        }
      },

      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Format the response
    const mediaItems = creations.map(item => ({
      title: item.title || item.category?.name || "Untitled",
      description: item.description || item.category?.description || "No description available.",
      source: item.source,
      inputImages:item.inputMap,
      outputMap:item.outputMap,
      type: item.type,
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
      message: "Failed to fetch library data.",
      error: error.message
    });
  }
};
