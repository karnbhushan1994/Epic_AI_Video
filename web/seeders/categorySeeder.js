import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import slugify from '../utils/slugify.js';

dotenv.config(); // Load MONGO_URI from .env

// Seed Data
// const categories = [
//   {
//     name: 'Fashion',
//     type: 'video',
//     level: 0,
//     sortOrder: 1,
//     description: 'Top-level domain for all fashion-related templates',
//     children: [
//       {
//         name: 'Full Body Outfits',
//         type: 'video',
//         level: 1,
//         sortOrder: 1,
//         description: 'Includes dresses, jumpsuits, co-ords',
//         tags: ['outfit', 'full-body'],
//         highlightAsNew: true,
//         isPremium: true,
//         availableForPlans: ['pro', 'enterprise'],
//         children: [
//           {
//             name: 'Rotate & Detail',
//             type: 'video',
//             level: 2,
//             sortOrder: 1,
//             description: 'Rotating videos with fabric/fit zooms',
//             tags: ['rotate', 'detail'],
//             videoDurations: 15,
//             usageCount: 0,
//             lastUsedTimestamp: null
//           },
//           {
//             name: 'Static Pose & Zoom',
//             type: 'video',
//             level: 2,
//             sortOrder: 2,
//             description: 'Subtle zooms while model is still',
//             tags: ['pose', 'zoom'],
//             videoDurations: 10,
//             usageCount: 0,
//             lastUsedTimestamp: null
//           }
//         ]
//       }
//     ]
//   }
// ];

// const categories = [
//   {
//     name: "Fashion",
//     slug: "fashion",
//     type: "video",
//     banner: "video", // or actual URL
//     description: "Top-level domain for all fashion-related templates",
//     parent: null,
//     level: 0,
//     sortOrder: 1,
//     comingSoon: false,
//     tags: ["Product", "Features"],
//     highlightAsNew: true,
//     isPremium: false,
//     availableForPlans: ["pro"],
//     videoDuration: "00:06",
//     like: false,
//     usageCount: 0,
//     lastUsedTimestamp: null,
//     children: [
//       {
//         name: "Top",
//         type: "video",
//         level: 1,
//         sortOrder: 1,
//         description: "Shirts, crop tops, and blouses",
//         tags: ["Top"],
//         highlightAsNew: true,
//         isPremium: true,
//         availableForPlans: ["pro", "enterprise"],
//         videoDuration: "00:08",
//         like: false,
//         usageCount: 0,
//         lastUsedTimestamp: null,
//         children: [
//           {
//             name: "Rotate",
//             type: "video",
//             level: 2,
//             sortOrder: 1,
//             description: "Rotating top-view with neckline focus",
//             tags: ["Rotate"],
//             highlightAsNew: false,
//             isPremium: false,
//             availableForPlans: ["pro"],
//             videoDuration: "00:08",
//             like: true,
//             usageCount: 0,
//             lastUsedTimestamp: null,
//             children: []
//           }
//         ]
//       },
//       {
//         name: "Bottom",
//         type: "video",
//         level: 1,
//         sortOrder: 2,
//         description: "Pants, skirts, shorts and more",
//         tags: ["Bottom"],
//         comingSoon: true,
//         highlightAsNew: false,
//         isPremium: false,
//         availableForPlans: ["pro"],
//         videoDuration: "00:00",
//         like: false,
//         usageCount: 0,
//         lastUsedTimestamp: null,
//         children: []
//       },
//       {
//         name: "Full Body Outfits",
//         type: "video",
//         level: 1,
//         sortOrder: 3,
//         description: "Includes dresses, jumpsuits, co-ords",
//         tags: ["outfit", "full-body"],
//         highlightAsNew: true,
//         isPremium: true,
//         availableForPlans: ["pro", "enterprise"],
//         comingSoon: true,
//         children: [
//           {
//             name: "Rotate & Detail",
//             type: "video",
//             level: 2,
//             sortOrder: 1,
//             description: "Rotating videos with fabric/fit zooms",
//             tags: ["rotate", "detail"],
//             videoDuration: "00:15",
//             like: false,
//             usageCount: 0,
//             lastUsedTimestamp: null,
//             children: []
//           },
//           {
//             name: "Static Pose & Zoom",
//             type: "video",
//             level: 2,
//             sortOrder: 2,
//             description: "Subtle zooms while model is still",
//             tags: ["pose", "zoom"],
//             videoDuration: "00:10",
//             like: false,
//             usageCount: 0,
//             lastUsedTimestamp: null,
//             children: []
//           }
//         ]
//       }
//     ]
//   }
// ];

const categories = [
  {
    name: "Background Magic",
    slug: "background-magic",
    type: "image",
    banner: "video",
    description: "Edit backgrounds of existing images using AI",
    parent: null,
    level: 0,
    sortOrder: 1,
    comingSoon: false,
    highlightAsNew: false,
    isPremium: false,
    availableForPlans: [],
    videoDuration: "",
    like: false,
    usageCount: 0,
    lastUsedTimestamp: null,
    children: [
      {
        name: "Remove Background",
        slug: "remove-background",
        type: "image",
        level: 1,
        sortOrder: 1,
        description: "Remove background from any existing image using the power of AI",
        highlightAsNew: false,
        isPremium: true,
        availableForPlans: ["pro", "enterprise"],
        videoDuration: "",
        like: false,
        usageCount: 0,
        lastUsedTimestamp: null
      }
    ]
  }
];

// const categories = [
//   {
//     name: "Tops & Upper Body",
//     slug: "tops-upper-body",
//     type: "video",
//     banner: "video",
//     description: "T-shirts, blouses, crop tops, sweaters, shrugs, kaftans etc.",
//     parent: null,
//     level: 0,
//     sortOrder: 1,
//     comingSoon: false,
//     highlightAsNew: false,
//     isPremium: false,
//     availableForPlans: [],
//     videoDuration: "",
//     like: false,
//     usageCount: 0,
//     lastUsedTimestamp: null,
//     children: [
//       {
//         name: "AI Magic Motion",
//         slug: "ai-magic-motion",
//         type: "video",
//         level: 1,
//         sortOrder: 1,
//         description: "Random AI-powered subtle motion from static images.",
//         highlightAsNew: false,
//         tags: ["Magic Motion"],
//         isPremium: false,
//         availableForPlans: ["pro", "enterprise"],
//         videoDuration: "",
//         like: false,
//         usageCount: 0,
//         lastUsedTimestamp: null
//       },
//       {
//         name: "Half Rotation",
//         slug: "half-rotation",
//         type: "video",
//         level: 1,
//         sortOrder: 2,
//         description: "Half rotation to show both sides of the garment.",
//         highlightAsNew: false,
//         tags: ["Half Rotation"],
//         isPremium: false,
//         availableForPlans: ["pro", "enterprise"],
//         videoDuration: "",
//         like: false,
//         usageCount: 0,
//         lastUsedTimestamp: null
//       }
//     ]
//   }
// ];


const insertCategory = async (node, parent = null) => {
  const slug = slugify(node.name);
  const categoryData = {
    name: node.name,
    slug,
    type: node.type,
    description: node.description,
    parent,
    level: node.level ?? 0,
    sortOrder: node.sortOrder ?? 0,
    banner: `https://example.com/banners/${slug}.jpg`,
    comingSoon: node.comingSoon || false,
    tags: node.tags || [],
    highlightAsNew: node.highlightAsNew || false,
    isPremium: node.isPremium || false,
    availableForPlans: node.availableForPlans || ['pro'],
    videoDurations: node.videoDurations || undefined,
    usageCount: node.usageCount ?? (node.children ? undefined : 0),
    lastUsedTimestamp: node.lastUsedTimestamp ?? (!node.children ? Date.now() : null)
  };

  try {
    const category = new Category(categoryData);
    const saved = await category.save();
    console.log(`Saved: ${saved.name} (Level ${saved.level})`);

    if (Array.isArray(node.children) && node.children.length > 0) {
      for (const child of node.children) {
        await insertCategory(child, saved._id);
      }
    }
  } catch (err) {
    console.error(`Error saving ${node.name}: ${err.message}`);
  }
};

// Run Seeder
const seedCategories = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

   // await Category.deleteMany();
    console.log('Existing categories cleared');

    for (const top of categories) {
      await insertCategory(top);
    }

    console.log('Category seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedCategories();
