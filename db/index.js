const { Client } = require("pg"); // imports the pg module

const client = new Client("postgres://localhost:5432/juicebox-dev");

async function createUser({ username, password, name, location }) {
  try {
    const { rows } = await client.query(
      `
      INSERT INTO users(username, password, name, location) 
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `,
      [username, password, name, location]
    );

    return createUser;
  } catch (error) {
    throw error;
  }
}

async function createPost({ authorId, title, content, tags = [] }) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
      INSERT INTO posts( "authorId", title, content ) 
      VALUES($1, $2, $3)
      RETURNING *;
    `,
      [authorId, title, content]
    );

    const tagList = await createTags(tags);

    const postsWithTags = await addTagsToPost(post.id, tagList);

    return postsWithTags;
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  const { rows } = await client.query(`
  SELECT 
    id,
    username,
    name,
    location,
    active
   FROM users
    `);

  return rows;
}

async function getAllPosts() {
  try {
    const { rows: postIds } = await client.query(`
  SELECT id
   FROM posts;
    `);
    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );
    return posts;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  // build the set string
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");
  const {
    rows: [user],
  } = await client.query(
    `

  `,
    []
  );
  // return early if this is called without fields
  if (setString.length === 0) {
    return user;
  }

  try {
    const {
      rows: [updatedUser],
    } = await client.query(
      `
      UPDATE users
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return updatedUser;
  } catch (error) {
    throw error;
  }
}

async function updatePost(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  if (setString.length === 0) {
    return post;
  }

  try {
    const { rows } = await client.query(
      `
      UPDATE posts
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await client.query(`
      SELECT id
      FROM posts
      WHERE "authorId"=${userId};
    `);

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );

    return posts;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(`
      SELECT * FROM users
      WHERE id=${userId};
    `);

    return user;
  } catch (error) {
    throw error;
  }
}

async function createTags(tagList) {
  if (tagList.length === 0) {
    return [];
  }

  try {
    const insertValues = tagList
      .map((_, index) => `$${index + 1}`)
      .join("), (");
    const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(
      `
    INSERT INTO tags(name)
    VALUES (${insertValues}) 
    ON CONFLICT (name) DO NOTHING
    `,
      tagList
    );

    const { rows } = await client.query(
      `
    SELECT * FROM tags
    WHERE name
    IN (${selectValues})
    `,
      tagList
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    await client.query(
      `
    INSERT INTO post_tags("postId", "tagId")
    VALUES ($1, $2)
    ON CONFLICT ("postId", "tagId") DO NOTHING
    `,
      [postId, tagId]
    );
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );
    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
      SELECT *
      FROM posts
      WHERE id=$1;
    `,
      [postId]
    );

    const { rows: tags } = await client.query(
      `
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  createUser,
  getAllUsers,
  getAllPosts,
  updateUser,
  createPost,
  updatePost,
  getPostsByUser,
  getUserById,
  createPostTag,
  createTags,
  getPostById,
  addTagsToPost,
};
