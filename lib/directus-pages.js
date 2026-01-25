const { readItems } = require('@directus/sdk');
const { directusClient } = require('./directus-auth');
const debug = require('debug')('hello-world:pages');

/**
 * Read page metadata from Directus using the provided access token
 */
async function readPageMetadata(slug, accessToken) {
  try {
    // Set the user's token
    directusClient.setToken(accessToken);
    
    debug(`Fetching page with slug "${slug}" with token`);
    
    // Query the pages collection by slug
    const pages = await directusClient.request(
      readItems('pages', {
        filter: { slug: { _eq: slug } },
        fields: ['*', 'rows', 'rows.*', 'rows.stacks', 'rows.stacks.*', 'rows.stacks.bricks', 'rows.stacks.bricks.*', 'rows.stacks.bricks.*.*'],
        limit: 1
      })
    );
    
    // Return null if no page found
    if (!pages || pages.length === 0) {
      debug(`No page found with slug "${slug}"`);
      return null;
    }
    
    const pageData = pages[0];
    debug(`Successfully fetched page with slug "${slug}"`);
    debug(`Complete page data: ${JSON.stringify(pageData, null, 2)}`);
    
    return pageData;
  } catch (error) {
    debug(`Error fetching page with slug "${slug}": ${error.message}`);
    
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
