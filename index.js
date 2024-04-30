const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { JSDOM } = require("jsdom");

const app = express();

const port = 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(cors());

app.get("/ssl-analyze", async (req, res) => {
  try {
    const { hostname } = req.query;
    if (!hostname) {
      return res.status(400).json({ error: "Hostname is required" });
    }
    const response = await axios.get(
      `https://api.ssllabs.com/api/v3/analyze?host=${hostname}&all=on`
    );
    res.json(response?.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/heading-tag-checker", async (req, res) => {
  try {
    const { websiteUrl } = req.query;
    if (!websiteUrl) {
      return res.status(400).json({ error: "Website URL is required" });
    }
    const response = await axios.get(websiteUrl);
    const html = response.data;

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const headings = Array.from(
      doc.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).map((heading) => ({
      tagName: heading.tagName,
      count: 1,
      innerHTML: heading.innerHTML,
    }));

    const groupedHeadings = headings.reduce((acc, heading) => {
      const foundHeading = acc.find((h) => h.tagName === heading.tagName);
      if (foundHeading) {
        foundHeading.count += 1;
      } else {
        acc.push(heading);
      }
      return acc;
    }, []);

    res.json(groupedHeadings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/meta-tag-analyzer", async (req, res) => {
  try {
    const { websiteUrl } = req.query;
    if (!websiteUrl) {
      return res.status(400).json({ error: "Website URL is required" });
    }
    const response = await axios.get(websiteUrl);
    const html = response.data;

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const metaTags = Array.from(doc.querySelectorAll("meta"))
      .map((meta) => ({
        name:
          meta.getAttribute("name") ||
          meta.getAttribute("property") ||
          meta.getAttribute("charset"),
        content: meta.getAttribute("content"),
      }))
      .filter((meta) => meta.name);

    res.json(metaTags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
