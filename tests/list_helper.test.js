const listHelper = require("../utils/list_helper");

const listWIthMultipleBlogs = [
  {
    _id: "5a422a851b54a676234d17f7",
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    __v: 0,
  },
  {
    _id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0,
  },
  {
    _id: "5a422b3a1b54a676234d17f9",
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
    __v: 0,
  },
  {
    _id: "5a422b891b54a676234d17fa",
    title: "First class tests",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    likes: 10,
    __v: 0,
  },
  {
    _id: "5a422ba71b54a676234d17fb",
    title: "TDD harms architecture",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 0,
    __v: 0,
  },
  {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
    __v: 0,
  },
];

test("dummy returns one", () => {
  const blogs = [];

  const result = listHelper.dummy(blogs);
  expect(result).toBe(1);
});

describe("total likes", () => {
  const listWIthOneBlog = [
    {
      _id: "5a422a851b54a676234d17f7",
      title: "React patterns",
      author: "Michael Chan",
      url: "https://reactpatterns.com/",
      likes: 7,
      __v: 0,
    },
  ];

  test("when list is empty equals 0", () => {
    const result = listHelper.totalLikes([]);
    expect(result).toBe(0);
  });

  test("when list has only one blog equals the likes of that", () => {
    const result = listHelper.totalLikes(listWIthOneBlog);
    expect(result).toBe(7);
  });

  test("when list has multiple blogs equals the sum of their likes", () => {
    const result = listHelper.totalLikes(listWIthMultipleBlogs);
    expect(result).toBe(36);
  });
});

describe("favourite blog", () => {
  test("when list is empty is null", () => {
    const result = listHelper.favoriteBlog([]);
    expect(result).toBeNull();
  });

  test("when list has blogs equals the one with the most likes", () => {
    const result = listHelper.favoriteBlog(listWIthMultipleBlogs);
    expect(result).toEqual(listWIthMultipleBlogs[2]);
  });
});

describe("author with most blogs", () => {
  test("when list is empty is null", () => {
    const result = listHelper.mostBlogs([]);
    expect(result).toBeNull();
  });

  test("when list has blogs is the one whose blogs appear in the list the most times", () => {
    const result = listHelper.mostBlogs(listWIthMultipleBlogs);
    expect(result).toEqual({ author: "Robert C. Martin", blogs: 3 });
  });
});

describe("author with most likes", () => {
  test("when list is empty is null", () => {
    const result = listHelper.mostLikes([]);
    expect(result).toBeNull();
  });

  test("when list has blogs is the one whose blogs have the most likes in total", () => {
    const result = listHelper.mostLikes(listWIthMultipleBlogs);
    expect(result).toEqual({ author: "Edsger W. Dijkstra", likes: 17 });
  });
});
