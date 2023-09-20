const supertest = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);
const Blog = require("../models/blog");
const User = require("../models/user");

describe("when there are initially some blogs saved", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("password", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();

    await Blog.deleteMany({});

    const blogs = helper.initialBlogs.map((blog) => ({
      ...blog,
      user: user._id,
    }));

    await Blog.insertMany(blogs);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all blogs are returned", async () => {
    const response = await api.get("/api/blogs");

    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });

  test("blogs have 'id' property", async () => {
    const response = await api.get("/api/blogs");

    expect(response.body[0].id).toBeDefined();
  });

  describe("addition of a new blog", () => {
    describe("when user is logged in", () => {
      test("succeeds with valid data", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const newBlog = {
          title: "some blog",
          author: "Some Author",
          url: "http://someblog.com",
          likes: 3,
        };

        await api
          .post("/api/blogs")
          .set("Authorization", authHeader)
          .send(newBlog)
          .expect(201)
          .expect("Content-Type", /application\/json/);

        const blogsAtEnd = await helper.blogsInDb();
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

        const urls = blogsAtEnd.map((blog) => blog.url);
        expect(urls).toContain("http://someblog.com");
      });

      test("succeeds without likes, likes defaulting to 0", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const newBlog = {
          title: "some blog",
          author: "Some Author",
          url: "http://someblog.com",
        };

        await api
          .post("/api/blogs")
          .set("Authorization", authHeader)
          .send(newBlog)
          .expect("Content-Type", /application\/json/);

        const blog = await Blog.find({ title: "some blog" });

        expect(blog[0].likes).toBe(0);
      });

      test("without title fails with status code 400", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const newBlog = {
          author: "Some Author",
          url: "http://someblog.com",
          likes: 3,
        };

        await api
          .post("/api/blogs")
          .set("Authorization", authHeader)
          .send(newBlog)
          .expect(400);

        const blogsAtEnd = await helper.blogsInDb();

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
      });

      test("without url fails with status code 400", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const newBlog = {
          title: "some blog",
          author: "Some Author",
          likes: 3,
        };

        await api
          .post("/api/blogs")
          .set("Authorization", authHeader)
          .send(newBlog)
          .expect(400);

        const blogsAtEnd = await helper.blogsInDb();

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
      });
    });

    describe("when user is not logged in", () => {
      test("fails with proper status code and message", async () => {
        const newBlog = {
          title: "some blog",
          author: "Some Author",
          url: "http://someblog.com",
          likes: 3,
        };

        const result = await api
          .post("/api/blogs")
          .send(newBlog)
          .expect(401)
          .expect("Content-Type", /application\/json/);

        expect(result.body.error).toBe("invalid token");

        const blogsAtEnd = await helper.blogsInDb();
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
      });
    });
  });

  describe("deletion of a blog", () => {
    describe("when user is logged in", () => {
      test("succeeds with a valid id if blog belongs to the user", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const id = helper.initialBlogs[0]._id;

        await api
          .delete(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .expect(204);

        const deletedBlog = await Blog.findById(id);

        expect(deletedBlog).toBeNull();
      });

      test("fails with a proper status code and message if blog does not belong to the user", async () => {
        const passwordHash = await bcrypt.hash("password", 10);
        const user = new User({ username: "another", passwordHash });
        await user.save();

        const authHeader = await helper.generateAuthHeaderForUser("another");
        const id = helper.initialBlogs[0]._id;

        const result = await api
          .delete(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .expect(403)
          .expect("Content-Type", /application\/json/);

        expect(result.body.error).toBe("You are not authorized");

        const deletedBlog = await Blog.findById(id);

        expect(deletedBlog).not.toBeNull();
      });

      test("fails with status code 404 if blog doesn't exist", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const id = await helper.nonExistingId();

        await api
          .delete(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .expect(404);
      });

      test("fails with status code 400 if id is not valid", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const id = "123456";

        await api
          .delete(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .expect(400);
      });
    });

    describe("when user is not logged in", () => {
      test("fails with proper status code and message", async () => {
        const id = helper.initialBlogs[0]._id;

        const result = await api
          .delete(`/api/blogs/${id}`)
          .expect(401)
          .expect("Content-Type", /application\/json/);

        expect(result.body.error).toBe("invalid token");

        const deletedBlog = await Blog.findById(id);
        expect(deletedBlog).not.toBeNull();
      });
    });
  });

  describe("updating a blog", () => {
    describe("when user is logged in", () => {
      test("succeeds with a valid id if blog belongs to the user", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const id = helper.initialBlogs[0]._id;
        const updateData = {
          title: "updated",
          author: "updated",
          url: "updated",
          likes: 222,
        };

        await api
          .put(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(200)
          .expect("Content-Type", /application\/json/);

        const updatedBlog = await Blog.findById(id);
        expect(updatedBlog).toMatchObject(updateData);
      });

      test("fails with a proper status code and message if blog does not belong to the user", async () => {
        const passwordHash = await bcrypt.hash("password", 10);
        const user = new User({ username: "another", passwordHash });
        await user.save();

        const authHeader = await helper.generateAuthHeaderForUser("another");
        const id = helper.initialBlogs[0]._id;
        const updateData = {
          title: "updated",
          author: "updated",
          url: "updated",
          likes: 222,
        };

        const result = await api
          .put(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .send(updateData)
          .expect(403)
          .expect("Content-Type", /application\/json/);

        expect(result.body.error).toBe("You are not authorized");

        const updatedBlog = await Blog.findById(id);
        expect(updatedBlog).not.toMatchObject(updateData);
      });

      test("fails with status code 404 if blog doesn't exist", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const id = await helper.nonExistingId();

        await api
          .put(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .expect(404);
      });

      test("fails with status code 400 if id is not valid", async () => {
        const authHeader = await helper.generateAuthHeaderForUser("root");
        const id = "123456";

        await api
          .put(`/api/blogs/${id}`)
          .set("Authorization", authHeader)
          .expect(400);
      });
    });

    describe("when user is not logged in", () => {
      test("fails with proper status code and message", async () => {
        const id = helper.initialBlogs[0]._id;
        const updateData = {
          title: "updated",
          author: "updated",
          url: "updated",
          likes: 222,
        };

        const result = await api
          .put(`/api/blogs/${id}`)
          .send(updateData)
          .expect(401)
          .expect("Content-Type", /application\/json/);

        expect(result.body.error).toBe("invalid token");

        const updatedBlog = await Blog.findById(id);
        expect(updatedBlog).not.toMatchObject(updateData);
      });
    });
  });
});
