var express = require('express');
const { directusClient } = require('../lib/directus-auth');
const { readItems } = require('@directus/sdk');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const pages = await directusClient.request(
    readItems('pages', {
      fields: ['title', 'status', 'slug'],
    })
  );
  
  res.render('index', { pages });
});

module.exports = router;
