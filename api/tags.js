const express = require('express');
const tagsRouter = express.Router();
const { getPostsByTagName } = require('../db/index')

tagsRouter.use((req, res, next) => {
  next();
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
  try {
    const allPosts = await getPostsByTagName(req.params.tagName);

    const posts = allPosts.filter(post => {
      if(post.active) {
        return true;
      }
      if(req.user && post.author.id === req.user.id) {
        return true;
      }
      return false
    });

    res.send({
      posts
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = tagsRouter;