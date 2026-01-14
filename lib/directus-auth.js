const { createDirectus, rest, authentication, readMe } = require('@directus/sdk');
const debug = require('debug')('hello-world:server');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://dokploy-rob.uksouth.cloudapp.azure.com';

// Create Directus client with authentication
const directusClient = createDirectus(DIRECTUS_URL)
  .with(authentication())
  .with(rest());

/**
 * Login user with Directus
 */
async function login(email, password) {
  try {
    debug(`Attempting login for ${email}`);
    const authResult = await directusClient.login(email, password);

    debug(`Login successful for ${email}. Tokens received: ${JSON.stringify(authResult)}`);
    
    // Store tokens globally (in production, consider using a token store)
    global.directusToken = authResult.access_token;
    global.directusRefreshToken = authResult.refresh_token;
    
    return {
      success: true,
      access_token: authResult.access_token,
      refresh_token: authResult.refresh_token,
      expires: authResult.expires,
      user: authResult.user
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
}

/**
 * Logout user
 */
async function logout(refreshToken) {
  try {
    await directusClient.logout();
    
    global.directusToken = null;
    global.directusRefreshToken = null;
    
    return { success: true };
  } catch (error) {
    // Even if logout fails, clear tokens locally
    global.directusToken = null;
    global.directusRefreshToken = null;
    
    return { success: true };
  }
}

/**
 * Verify and refresh token if needed
 */
async function verifyToken(accessToken, refreshToken) {
  try {
    // Create a temporary client with the access token to verify it's valid
    const tempClient = createDirectus(DIRECTUS_URL)
      .with(rest())
      .with(authentication('json'));
    
    debug(`Verifying access token: ${accessToken}`);
    
    // Set the token
    tempClient.setToken(accessToken);
    
    debug('Access token set, fetching current user to verify validity');

    // Try to fetch current user
    const user = await tempClient.request(readMe());
    
    return {
      valid: true,
      user
    };
  } catch (error) {
    debug(`Token verification failed: ${error}`);
    if (error.status === 401 && refreshToken) {
      // Token expired, try to refresh
      try {
        const tempClient = createDirectus(DIRECTUS_URL)
          .with(rest())
          .with(authentication());
        
        const refreshResult = await tempClient.refresh(refreshToken);
        
        const newAccessToken = refreshResult.access_token;
        global.directusToken = newAccessToken;
        
        return {
          valid: true,
          token_refreshed: true,
          new_access_token: newAccessToken
        };
      } catch (refreshError) {
        return {
          valid: false,
          error: 'Token refresh failed'
        };
      }
    }
    
    return {
      valid: false,
      error: error.message || 'Token verification failed'
    };
  }
}

module.exports = {
  directusClient,
  login,
  logout,
  verifyToken,
  DIRECTUS_URL
};
