var _ = require("lodash");

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  let blogWithMostLikes = blogs[0];

  blogs.forEach((blog) => {
    if (blog.likes > blogWithMostLikes.likes) {
      blogWithMostLikes = blog;
    }
  });

  return blogWithMostLikes;
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const blogCountPerAuthor = Object.entries(_.countBy(blogs, "author"));
  blogCountPerAuthor.sort((a, b) => a[1] - b[1]);

  const authorWithMostBlogs = blogCountPerAuthor.at(-1);
  return { author: authorWithMostBlogs[0], blogs: authorWithMostBlogs[1] };
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const likesPerAuthor = Object.entries(_.groupBy(blogs, "author")).map(
    (item) => {
      const totalLikes = item[1].reduce(
        (sum, current) => sum + current.likes,
        0
      );
      return [item[0], totalLikes];
    }
  );
  likesPerAuthor.sort((a, b) => a[1] - b[1]);

  const authorWithMostLikes = likesPerAuthor.at(-1);
  return { author: authorWithMostLikes[0], likes: authorWithMostLikes[1] };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
