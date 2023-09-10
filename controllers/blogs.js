const blogsRouter = require("express").Router();
const Blog = require("../models/blog");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  const blog = new Blog(request.body);

  await blog.save();

  response.status(201).json(blog);
});

blogsRouter.delete("/:id", async (request, response) => {
  const deletedBlog = await Blog.findByIdAndDelete(request.params.id);

  if (!deletedBlog) {
    return response.status(404).end();
  }

  response.status(204).end();
});

blogsRouter.put("/:id", async (request, response) => {
  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true, context: "query" }
  );

  if (!updatedBlog) {
    response.status(404).end();
  }

  return response.json(updatedBlog);
});

module.exports = blogsRouter;
