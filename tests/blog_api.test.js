const supertest = require("supertest");
const mongoose = require("mongoose");
const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);
const Blog = require("../models/blog");

describe("when there are initially some blogs saved", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await Blog.insertMany(helper.initialBlogs);
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
    test("succeeds with valid data", async () => {
      const newBlog = {
        title: "some blog",
        author: "Some Author",
        url: "http://someblog.com",
        likes: 3,
      };

      await api
        .post("/api/blogs")
        .send(newBlog)
        .expect(201)
        .expect("Content-Type", /application\/json/);

      const blogsAtEnd = await helper.blogsInDb();
      expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

      const urls = blogsAtEnd.map((blog) => blog.url);
      expect(urls).toContain("http://someblog.com");
    });

    test("succeeds without likes, likes defaulting to 0", async () => {
      const newBlog = {
        title: "some blog",
        author: "Some Author",
        url: "http://someblog.com",
      };

      await api.post("/api/blogs").send(newBlog);

      const blog = await Blog.find({ title: "some blog" });

      expect(blog[0].likes).toBe(0);
    });

    test("without title fails with status code 400", async () => {
      const newBlog = {
        author: "Some Author",
        url: "http://someblog.com",
        likes: 3,
      };

      await api.post("/api/blogs").send(newBlog).expect(400);

      const blogsAtEnd = await helper.blogsInDb();

      expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
    });

    test("without url fails with status code 400", async () => {
      const newBlog = {
        title: "some blog",
        author: "Some Author",
        likes: 3,
      };

      await api.post("/api/blogs").send(newBlog).expect(400);

      const blogsAtEnd = await helper.blogsInDb();

      expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
    });
  });

  describe("deletion of a blog", () => {
    test("succeeds with a valid id", async () => {
      const id = helper.initialBlogs[0]._id;

      await api.delete(`/api/blogs/${id}`).expect(204);

      const deletedBlog = await Blog.findById(id);

      expect(deletedBlog).toBeNull;
    });

    test("fails with status code 404 if blog doesn't exist", async () => {
      const id = await helper.nonExistingId();

      await api.delete(`/api/blogs/${id}`).expect(404);
    });

    test("fails with status code 400 if id is not valid", async () => {
      const id = "123456";

      await api.delete(`/api/blogs/${id}`).expect(400);
    });
  });

  describe("updating a blog", () => {
    test("succeeds with a valid id", async () => {
      const id = helper.initialBlogs[0]._id;
      const updateData = {
        title: "updated",
        author: "updated",
        url: "updated",
        likes: 222,
      };

      await api.put(`/api/blogs/${id}`).send(updateData).expect(200);

      const updatedBlog = await Blog.findById(id);
      expect(updatedBlog).toMatchObject(updateData);
    });

    test("fails with status code 404 if blog doesn't exist", async () => {
      const id = await helper.nonExistingId();

      await api.put(`/api/blogs/${id}`).expect(404);
    });

    test("fails with status code 400 if id is not valid", async () => {
      const id = "123456";

      await api.put(`/api/blogs/${id}`).expect(400);
    });
  });
});
