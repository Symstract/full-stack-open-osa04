const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const middleware = require("../utils/middleware");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { blogs: 0 });
  response.json(blogs);
});

blogsRouter.post("/", middleware.userExtractor, async (request, response) => {
  const user = await User.findById(request.user);

  const blog = new Blog({ ...request.body, user: user._id });
  await blog.save();

  user.blogs = user.blogs.concat(blog._id);
  await user.save();

  response.status(201).json(blog);
});

blogsRouter.delete(
  "/:id",
  middleware.userExtractor,
  async (request, response) => {
    const blog = await Blog.findById(request.params.id);

    if (!blog) {
      return response.status(404).end();
    }

    if (blog.user.toString() !== request.user) {
      return response.status(403).json({ error: "You are not authorized" });
    }

    await Blog.findByIdAndRemove(request.params.id);

    response.status(204).end();
  }
);

blogsRouter.put("/:id", middleware.userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id);

  if (!blog) {
    response.status(404).end();
  }

  if (blog.user.toString() !== request.user) {
    return response.status(403).json({ error: "You are not authorized" });
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true, context: "query" }
  );

  return response.json(updatedBlog);
});

module.exports = blogsRouter;
