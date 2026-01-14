var express = require('express');
var router = express.Router();
const { readPageMetadata } = require('../lib/directus-pages');

/* GET page by ID */
router.get('/:id', async function(req, res, next) {
  try {
    const pageId = req.params.id;
    const accessToken = req.session.access_token;
    
    // Fetch page metadata from Directus
    const pageData = await readPageMetadata(pageId, accessToken);
    
    if (!pageData) {
      return res.status(404).render('error', {
        message: 'Page not found',
        error: { status: 404 }
      });
    }
    
    res.render('page', { 
      title: pageData.title || 'Page',
      page: pageData 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
