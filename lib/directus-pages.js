const { createDirectus, rest, authentication, readItem } = require('@directus/sdk');
const debug = require('debug')('hello-world:pages');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://dokploy-rob.uksouth.cloudapp.azure.com';

/**
 * Read page metadata from Directus using the provided access token
 */
async function readPageMetadata(pageId, accessToken) {
  try {
    // Create a client with the user's access token
    const client = createDirectus(DIRECTUS_URL)
      .with(rest())
      .with(authentication('json'));
    
    // Set the user's token
    client.setToken(accessToken);
    
    debug(`Fetching page ${pageId} with token`);
    
    // Read the page from Directus
    const pageData = await client.request(
      readItem('pages', pageId, {
        fields: ['*']
      })
    );
    
    debug(`Successfully fetched page ${pageId}`);
    
    return pageData;
  } catch (error) {
    debug(`Error fetching page ${pageId}: ${error.message}`);
    
    // If it's a 404, return null
    if (error.status === 404) {
      return null;
    }
    
    throw error;
  }
}

module.exports = {
  readPageMetadata
};
