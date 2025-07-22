// 📁 web/controllers/categoryController.js
import Category from '../../models/Category.js';
import slugify from '../../utils/slugify.js';

export const createCategory = async function (req, res) {
  try {
    const { name, type, description, parent, level = 0, sortOrder = 0 } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!type || typeof type !== 'string' || !['image', 'video'].includes(type)) {
      return res.status(400).json({ error: "Valid type (image or video) is required" });
    }

    const slug = slugify(name);
    if (!slug) {
      return res.status(400).json({ error: "Invalid name for slug generation" });
    }

    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(409).json({ error: "A category with this slug already exists" });
    }

    const newCategory = new Category({
      name,
      slug,
      type,
      description,
      parent: parent || null,
      level,
      sortOrder
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const listCategories = async (req, res) => {
//   try {
//     const session = res.locals.shopify.session; // ✅ यहाँ से safe access
//     const shop = session.shop;
//     const accessToken = session.accessToken;
//     console.log(shop+"-"+accessToken);
//     const categories = await Category.find().sort({ level: 1, sortOrder: 1 }).lean();

//     const map = new Map();
//     categories.forEach(cat => {
//       cat.children = [];
//       map.set(String(cat._id), cat);
//     });

//     const tree = [];
//     categories.forEach(cat => {
//       if (cat.parent) {
//         const parent = map.get(String(cat.parent));
//         if (parent) parent.children.push(cat);
//       } else {
//         tree.push(cat);
//       }
//     });

//     res.status(200).json(tree);
//   } catch (error) {
//     console.error("Category fetch error:", error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const listCategories = async (req, res) => {
  try {
    const { rootSlug, type = "video" } = req.query; // default to video if not provided
    //console.log("Requested type:", type); // Debug log

    // Correct query
    const allCategories = await Category.find({ type }).sort({ level: 1, sortOrder: 1 }).lean();

    // Build map
    const map = new Map();
    allCategories.forEach(cat => {
      cat.children = [];
      map.set(String(cat._id), cat);
    });

    // Connect children to their parents
    allCategories.forEach(cat => {
      if (cat.parent) {
        const parent = map.get(String(cat.parent));
        if (parent) {
          parent.children.push(cat);
        }
      }
    });

    if (rootSlug) {
      const root = allCategories.find(cat => cat.slug === rootSlug);
      if (!root) return res.status(404).json({ message: `No category found with slug: ${rootSlug}` });
      return res.status(200).json(map.get(String(root._id)));
    }

    const roots = allCategories.filter(cat => cat.parent === null).map(cat => map.get(String(cat._id)));
    return res.status(200).json(roots);

  } catch (error) {
    console.error("Video category API error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
