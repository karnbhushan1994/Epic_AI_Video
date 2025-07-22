
export function verifyRequest(shopify) {
  return async (req, res, next) => {
    try {
      // Try JWT-based session first (App Bridge / Embedded app)
      const sessionId = await shopify.api.session.getCurrentId({
        isOnline: true,
        rawRequest: req,
        rawResponse: res,
      });

      if (sessionId) {
        const session = await shopify.sessionStorage.loadSession(sessionId);
        if (session && session.accessToken) {
          req.shopifySession = session;
          return next(); // Success from App Bridge session
        }
      }

      //  Fallback: Check for direct access token (Postman / curl)
      const shop = req.query.shop || req.headers['x-shopify-shop'];
      const accessToken =
        req.headers['x-shopify-access-token'] ||
        req.headers['authorization']?.replace(/^Bearer\s+/i, '');

      if (!shop || !accessToken) {
        return res.status(401).json({ error: 'Shop OR  Access Token Not Found' });
      }
      req.shopifySession = { shop, accessToken };
      return next();
    } catch (error) {
      console.error('Error in verifyRequest middleware:', error);
      return res.status(500).json({ error: 'Session verification FAILED' });
    }
  };
}
