const {
  client,
  createUser,
  getAllUsers,
  getUserByUsername,
  getAllPosts,
  updateUser,
  createPost,
  updatePost,
  getPostsByUser,
  getUserById,
  getPostById,
  createPostTag,
  createTags,
  addTagsToPost,
  getPostsByTagName,
  getAllTags,
} = require("./index");

async function dropTables() {
  try {
    await client.query(`
      DROP TABLE IF EXISTS post_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;
    `);
  } catch (error) {
    throw error;
  }
}

async function createTables() {
  try {
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT true
        )
      `);
    await client.query(`
      CREATE TABLE posts(
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      )
    `);
    await client.query(`
      CREATE TABLE tags(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
        )
      `);

    await client.query(`
      CREATE TABLE post_tags (
        "postId" INTEGER REFERENCES posts(id),
        "tagId" INTEGER REFERENCES tags(id), 
        UNIQUE ("postId", "tagId")
      )
      `);
  } catch (error) {
    throw error;
  }
}

async function createInitialUsers() {
  try {
    await createUser({
      username: "albert",
      password: "bertie99",
      name: "Al Bert",
      location: "Sidney, Australia",
      active: "",
    });
    await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "Just Sandra",
      location: "Ain't tellin'",
      active: "",
    });
    await createUser({
      username: "glamgal",
      password: "soglam",
      name: "Joshua",
      location: "Upper East Side",
      active: "",
    });

  } catch (error) {
    throw error;
  }
}

async function createInitialPosts() {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();
    await createPost({
      authorId: albert.id,
      title: "First Post",
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything"],
    });
    await createPost({
      authorId: sandra.id,
      title: "First Post",
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#worst-day-ever"],
    });

    await createPost({
      authorId: glamgal.id,
      title: "First Post",
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything", "#canmandoeverything"],
    });
  } catch (error) {
    throw error;
  }
}

async function createInitialTags() {
  try {
    const [happy, sad, inspo, catman] = await createTags([
      "#happy",
      "#worst-day-ever",
      "#youcandoanything",
      "#catmandoeverything",
    ]);

    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, inspo]);
    await addTagsToPost(postTwo.id, [sad, inspo]);
    await addTagsToPost(postThree.id, [happy, catman, inspo]);
  } catch (error) {
    throw error;
  }
}

async function rebuildDB() {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
  } catch (error) {
    throw error;
  }
}

async function testDB() {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Result:", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content",
    });
    console.log("Result:", updatePostResult);
    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);
    console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"],
    });
    console.log("Result:", updatePostTagsResult);

    console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy);

    console.log("Finished database tests!");
  } catch (error) {
    console.log("Error during testDB");
    throw error;
  }
}

rebuildDB(createInitialUsers, createInitialPosts, createInitialTags)
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
