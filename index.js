const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const { JSDOM } = require("jsdom");


const app = express();
app.use(express.json({ limit: "10mb" }));

const port = 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.use(cors());
app.use(bodyParser.json());

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
        foundHeading.innerHTML.push(heading.innerHTML);
      } else {
        acc.push({ ...heading, count: 1, innerHTML: [heading.innerHTML] });
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

app.get("/check-redirection", async (req, res) => {
  const { url } = req.query;

  try {
    const response = await axios.get(url, { maxRedirects: 0 });

    if (response.status === 200) {
      res.json({
        redirectUrl: "No redirection found",
        redirectType: response.status,
      });
    } else {
      const finalUrl = response.request.res.responseUrl;
      const status = response.status;
      res.json({
        redirectUrl: finalUrl,
        redirectType: `Redirected with status ${status}`,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchData(url) {
  try {
    const response = await axios.get(url);
    if (!response.data) {
      throw new Error("Failed to fetch URL");
    }
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch URL");
  }
}

async function parseHTML(html) {
  const { window } = new JSDOM(html);
  const { document } = window;

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    return canonical.getAttribute("href");
  } else {
    return "No canonical tag found";
  }
}

app.get("/check-canonical", async (req, res) => {
  try {
    const url = req.query.url;
    const html = await fetchData(url);
    const canonicalTag = await parseHTML(html);
    res.json({ canonicalTag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/alttext", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }
    const response = await axios.post("https://alttext.in/api/alttext", {
      image,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
