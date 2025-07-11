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
//       status: "pending",
//     });

//     res.status(201).json({ success: true, creation });
//   } catch (error) {
//     console.error("Error in templateCreations:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };
export const templateCreations = async function (req, res) {
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
      outputMap // ✅ pull from body
    } = req.body;

    // ✅ Build creation data dynamically
    const creationData = {
      shopDomain: shop,
      templateId,
      type,
      inputMap,
      inputImages,
      creditsUsed,
      meta,
      taskId,
      status: "pending"
    };

    // ✅ Only add outputMap if it's present and not empty
    if (Array.isArray(outputMap) && outputMap.length > 0) {
      creationData.outputMap = outputMap;
    }

    const creation = await Creation.create(creationData);

    res.status(201).json({ success: true, creation });
  } catch (error) {
    console.error("Error in templateCreations:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /creations/:id - update creation with outputMap and status
export const updateCreation = async (req, res) => {
  try {
    const { id } = req.params;
    const { outputMap, status, failureReason } = req.body;

    const updateFields = {};

    if (outputMap) updateFields.outputMap = outputMap;
    if (status) {
      updateFields.status = status;

      // ✅ Automatically set processingCompletedAt
      if (["completed", "failed"].includes(status)) {
        updateFields.processingCompletedAt = new Date();
      }
    }

    if (failureReason) updateFields.failureReason = failureReason;

    const updated = await Creation.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: "Creation not found" });
    }

    res.json({ success: true, creation: updated });
  } catch (error) {
    console.error("Error in updateCreation:", error); // ✅ correct label
    res.status(500).json({
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
//   "status": "completed",
//   "failureReason": null
// }
