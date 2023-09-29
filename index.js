const express = require('express');
const request = require('request-promise');
const _ = require('lodash');

const app = express();
const port = 3000;

// Function to fetch blog data from the API
async function fetchBlogData() {
  const apiUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
  const adminSecret = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';

  const options = {
    uri: apiUrl,
    headers: {
      'x-hasura-admin-secret': adminSecret,
    },
    json: true,
  };

  const response = await request(options);
  return response;
}

// Function to analyze blog data
function analyzeBlogData(blogs) {
  const totalBlogs = blogs.length;

  // Find the blog with the longest title
  const longestBlog = _.maxBy(blogs, (blog) => blog.title.length);

  // Determine the number of blogs with "privacy" in the title
  const privacyBlogs = _.filter(blogs, (blog) =>
    blog.title.toLowerCase().includes('privacy')
  );
  const numPrivacyBlogs = privacyBlogs.length;

  // Create an array of unique blog titles
  const uniqueTitles = _.uniqBy(blogs, 'title');

  return {
    totalBlogs,
    longestBlog: longestBlog.title,
    numPrivacyBlogs,
    uniqueTitles: uniqueTitles.map((blog) => blog.title),
  };
}

// Function to search blogs based on the query
function searchBlogs(blogs, query) {
  const lowercaseQuery = query.toLowerCase();

  // Filter blogs based on the query (case-insensitive)
  const filteredBlogs = _.filter(blogs, (blog) =>
    blog.title.toLowerCase().includes(lowercaseQuery)
  );

  return filteredBlogs;
}

// Memoize the fetchBlogData function to cache results for 1 minute (60000 milliseconds)
const memoizedFetchBlogData = _.memoize(fetchBlogData, () => 'blogData', 60000);

// Middleware to fetch and analyze blog data with caching
app.get('/api/blog-stats', async (req, res) => {
  try {
    // Use memoizedFetchBlogData to fetch blog data (with caching)
    const blogs = await memoizedFetchBlogData();

    // Analyze the data and send the response
    const analytics = analyzeBlogData(blogs);
    res.json(analytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching and analyzing blog data.' });
  }
});

// Middleware for blog search
app.get('/api/blog-search', async (req, res) => {
  const query = req.query.query;

  // Ensure query parameter is provided
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "query" is required.' });
  }

  try {
    // Use memoizedFetchBlogData to fetch blog data (with caching)
    const blogs = await memoizedFetchBlogData();

    // Filter blogs based on the query
    const filteredBlogs = searchBlogs(blogs, query);
    res.json(filteredBlogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching and analyzing blog data.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
