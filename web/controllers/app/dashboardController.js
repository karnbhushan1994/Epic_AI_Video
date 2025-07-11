import Category from '../../models/Category.js';
import Creation from '../../models/Creation.js';
import shopify from '../../shopify.js';
export const dashboard = async function(req,res){
    try {
        const categories = await Category.find({});
        return res.status(200).json({ categories });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// current merchant total creations
export const currentMerchantTotalCreations = async function(req, res) {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

         const endOfMonth = new Date(startOfMonth);
         endOfMonth.setMonth(endOfMonth.getMonth() + 1);
       //alert(session.shop);

        const session = res.locals.shopify.session; // ✅ session is available here

        const creations = await Creation.countDocuments({
            shopDomain:session.shop,
            status: 'completed',
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

        return res.status(200).json({ creations });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

