// D:\epic-app\epic-ai\web\controllers\app\productController.js

import shopify from '../../shopify.js';

export const fetchProduct = async function (req, res) {
  try {
    console.log("Fetching all products...");

    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ 
        error: 'No active session found' 
      });
    }

    const client = new shopify.api.clients.Graphql({ session });

    // Function to fetch all products using pagination
    const fetchAllProducts = async () => {
      let allProducts = [];
      let hasNextPage = true;
      let cursor = null;

      while (hasNextPage) {
        const response = await client.query({
          data: {
            query: `
              query getProducts($first: Int!, $after: String) {
                products(first: $first, after: $after) {
                  edges {
                    cursor
                    node {
                      id
                      title
                      handle
                      createdAt
                      vendor
                      productType
                      status
                      publishedAt
                      featuredImage {
                        url
                        altText
                        width
                        height
                      }
                      images(first: 5) {
                        edges {
                          node {
                            url
                            altText
                            width
                            height
                          }
                        }
                      }
                      variants(first: 1) {
                        edges {
                          node {
                            id
                            price
                            availableForSale
                          }
                        }
                      }
                    }
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            `,
            variables: {
              first: 250, // Maximum allowed per request
              after: cursor
            }
          }
        });

        if (response.body.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
        }

        const { edges, pageInfo } = response.body.data.products;
        
        // Add products from this page
        allProducts = allProducts.concat(edges.map(edge => edge.node));
        
        // Update pagination info
        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;

        console.log(`Fetched ${edges.length} products, total: ${allProducts.length}`);
      }

      return allProducts;
    };

    const allProducts = await fetchAllProducts();
    // Transform the products to include all necessary data for the frontend
    const products = allProducts.map((product) => {
      return {
        id: product.id, // Keep full GraphQL ID: gid://shopify/Product/123
        title: product.title,
        handle: product.handle,
        createdAt: product.createdAt,
        created_at: product.createdAt, // Provide both formats for compatibility
        vendor: product.vendor,
        productType: product.productType,
        product_type: product.productType, // Provide both formats
        status: product.status,
        publishedAt: product.publishedAt,
        
        // Featured image (primary image for the product)
        featuredImage: product.featuredImage ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText,
          width: product.featuredImage.width,
          height: product.featuredImage.height
        } : null,
        
        // All product images
        images: product.images.edges.map(({ node: image }) => ({
          url: image.url,
          altText: image.altText,
          width: image.width,
          height: image.height,
          src: image.url // Also provide 'src' for REST API compatibility
        })),
        
        // First variant info (useful for pricing)
        firstVariant: product.variants.edges.length > 0 ? {
          id: product.variants.edges[0].node.id,
          price: product.variants.edges[0].node.price,
          availableForSale: product.variants.edges[0].node.availableForSale
        } : null
      };
    });

    console.log(`Successfully fetched ALL ${products.length} products`);
    
    // Return products directly as array (matches your current frontend expectation)
    res.status(200).json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Handle different error types
    if (error.networkError) {
      return res.status(503).json({ 
        error: 'Network error - Shopify API unavailable',
        message: error.message 
      });
    }
    
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      return res.status(400).json({ 
        error: 'GraphQL query error',
        details: error.graphQLErrors 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: error.message || 'Unknown error occurred'
    });
  }
};

// Optional: Add a function to fetch a single product by ID
export const fetchSingleProduct = async function (req, res) {
  try {
    const { productId } = req.params;
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: 'No active session found' });
    }

    const client = new shopify.api.clients.Graphql({ session });

    // Ensure we have a proper GraphQL ID
    const graphqlId = productId.startsWith('gid://shopify/Product/') 
      ? productId 
      : `gid://shopify/Product/${productId}`;

    const response = await client.query({
      data: {
        query: `
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              title
              handle
              description
              createdAt
              vendor
              productType
              status
              featuredImage {
                url
                altText
                width
                height
              }
              images(first: 10) {
                edges {
                  node {
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    availableForSale
                    inventoryQuantity
                  }
                }
              }
            }
          }
        `,
        variables: {
          id: graphqlId
        }
      }
    });

    if (response.body.errors) {
      console.error('GraphQL errors:', response.body.errors);
      return res.status(400).json({ 
        error: 'Failed to fetch product',
        details: response.body.errors 
      });
    }

    const product = response.body.data.product;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Transform single product data
    const transformedProduct = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      createdAt: product.createdAt,
      vendor: product.vendor,
      productType: product.productType,
      status: product.status,
      featuredImage: product.featuredImage,
      images: product.images.edges.map(({ node }) => node),
      variants: product.variants.edges.map(({ node }) => node)
    };

    res.status(200).json(transformedProduct);

  } catch (error) {
    console.error('Error fetching single product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      message: error.message 
    });
  }
};