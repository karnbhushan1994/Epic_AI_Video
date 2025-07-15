import Creation from "../../models/Creation.js";
// POST /creations - create a new creation (without outputs yet)
// export const templateCreations = async function (req, res) {
//   try {
//     const shop = res.locals.shopify?.session?.shop;
//     if (!shop) {
//       return res.status(401).json({ error: "Shop not found in session" });
//     }

//     const {
//       templateId,
//       type,
//       inputMap,
//       inputImages,
//       associatedProductIds,
//       creditsUsed,
//       meta,
//       taskId, // ✅ include this
//     } = req.body;

//     const creation = await Creation.create({
//       shopDomain: shop,
//       templateId,
//       type,
//       inputMap,
//       inputImages,
//       associatedProductIds,
//       creditsUsed,
//       meta,
//       taskId, // ✅ pass it to DB
//       status: "PENDING",
//     });

//     res.status(201).json({ success: true, creation });
//   } catch (error) {
//     console.error("Error in templateCreations:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// POST /creations — Create a new template-based creation
export const templateCreations = async (req, res) => {
  try {
    const shop = res.locals.shopify?.session?.shop;

    if (!shop) {
      return res.status(401).json({ error: "Shop not found in session" });
    }

    const {
      templateId,
      type,
      inputMap,
      inputImages,
      creditsUsed,
      meta,
      taskId,
      outputMap,
      status
    } = req.body;

    if (!templateId || !type || !creditsUsed) {
      return res.status(400).json({
        error: "Missing required fields: templateId, type, creditsUsed"
      });
    }

    const creationData = {
      shopDomain: shop,
      templateId,
      type,
      inputMap: inputMap || [],
      inputImages: inputImages || [],
      creditsUsed,
      meta: meta || {},
      taskId,
      status: status
    };

    if (Array.isArray(outputMap) && outputMap.length > 0) {
      creationData.outputMap = outputMap;
    }

    const creation = await Creation.create(creationData);

    return res.status(201).json({ success: true, creation });
  } catch (error) {
    console.error("❌ Error in templateCreations:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};

// PUT /creations/:id — Update a creation's status or output
export const updateCreation = async (req, res) => {
  try {
    const { id } = req.params;
    const { outputMap, status, failureReason } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing creation ID in params" });
    }

    const updateFields = {};

    if (Array.isArray(outputMap)) {
      updateFields.outputMap = outputMap;
    }

    if (status) {
      updateFields.status = status.toUpperCase();

      if (["COMPLETED", "FAILED"].includes(updateFields.status)) {
        updateFields.processingCompletedAt = new Date(); // ✅ Fixed typo
      }
    }

    if (failureReason) {
      updateFields.failureReason = failureReason;
    }

    // Optional: log what's about to be updated
    //console.log("🔧 Updating creation with fields:", updateFields);

    const updated = await Creation.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: "Creation not found" });
    }

    return res.json({ success: true, creation: updated });
  } catch (error) {
    console.error("❌ Error in updateCreation:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
      details: error.stack,
    });
  }
};



// {
//   "templateId": "507f1f77bcf86cd799439011",
//   "type": "image",
//   "inputMap": [
//     {
//       "productId": "prod_123",
//       "imageUrl": "https://example.com/image1.jpg"
//     },
//     {
//       "productId": "prod_456",
//       "imageUrl": "https://example.com/image2.jpg"
//     }
//   ],
//   "inputImages": [
//     "https://example.com/input1.jpg",
//     "https://example.com/input2.jpg"
//   ],
//   "associatedProductIds": ["prod_123", "prod_456", "prod_789"],
//   "creditsUsed": 5,
//   "meta": {
//     "aspectRatio": "16:9",
//     "duration": 30,
//     "mode": "Pro",
//     "imageCount": 3
//   }
// }

// {
//   "outputMap": [
//     {
//       "productId": "prod_123",
//       "outputUrl": "https://example.com/output1.jpg"
//     },
//     {
//       "productId": "prod_456",
//       "outputUrl": "https://example.com/output2.jpg"
//     }
//   ],
//   "status": "COMPLETED",
//   "failureReason": null
// }
