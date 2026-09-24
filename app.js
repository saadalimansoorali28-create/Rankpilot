const modal = document.getElementById("tool-modal");
const form = document.getElementById("tool-form");
const result = document.getElementById("tool-result");
const title = document.getElementById("modal-title");
const copy = document.getElementById("modal-copy");

if (document.getElementById("year")) {
  document.getElementById("year").textContent = new Date().getFullYear();
}

const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[m]));

const configs = {
  keywords: {
    title: "Keyword Research",
    copy: "Generate practical keyword ideas from a seed keyword.",
    html: '<label>Seed keyword</label><div class="form-row"><input class="input" id="tool-input" placeholder="e.g. solar panel price"><button class="primary-small" id="run-tool">Research</button></div>'
  },
  youtube: {
    title: "YouTube SEO Planner",
    copy: "Create title, description and keyword ideas for your video.",
    html: '<label>Video topic</label><div class="form-row"><input class="input" id="tool-input" placeholder="e.g. solar panel prices in Pakistan"><button class="primary-small" id="run-tool">Create plan</button></div>'
  },
  audit: {
    title: "Website SEO Audit",
    copy: "Paste page HTML for a local on-page SEO check.",
    html: '<label>Page HTML</label><textarea class="input" id="tool-text" rows="9" placeholder="Paste page HTML here..."></textarea><div class="form-row"><button class="primary-small" id="run-tool">Audit</button></div>'
  },
  meta: {
    title: "Meta Tag Generator",
    copy: "Generate editable SEO and social meta tags.",
    html: '<label>Page topic</label><input class="input" id="tool-input" placeholder="Page topic"><label style="display:block;margin-top:14px">Primary keyword</label><input class="input" id="tool-keyword" placeholder="Primary keyword"><div class="form-row"><button class="primary-small" id="run-tool">Generate</button></div>'
  },
  density: {
    title: "Keyword Density",
    copy: "Measure exact phrase usage in your content.",
    html: '<textarea class="input" id="tool-text" rows="9" placeholder="Paste your content here..."></textarea><div class="form-row"><input class="input" id="tool-input" placeholder="Target keyword"><button class="primary-small" id="run-tool">Analyze</button></div>'
  },
  sitemap: {
    title: "Sitemap Helper",
    copy: "Generate a basic XML sitemap from your URLs.",
    html: '<textarea class="input" id="tool-text" rows="6" placeholder="One URL per line"></textarea><div class="form-row"><button class="primary-small" id="run-tool">Generate</button></div>'
  },
  bilibili: {
    title: "Bilibili Video Downloader",
    copy: "Paste a public Bilibili video URL to check available source formats.",
    html: '<label>Bilibili video URL</label><div class="form-row"><input class="input" id="tool-input" placeholder="https://www.bilibili.com/video/BV..."><button class="primary-small" id="run-tool">Get video</button></div>'
  }
};

function closeTool() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function showWarn(message) {
  result.hidden = false;
  result.innerHTML = '<p class="warn">' + esc(message) + '</p>';
}

function openTool(key) {
  const cfg = configs[key];
  if (!cfg) return;
  title.textContent = cfg.title;
  copy.textContent = cfg.copy;
  form.innerHTML = cfg.html;
  result.hidden = true;
  result.innerHTML = "";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  const button = document.getElementById("run-tool");
  if (button) button.addEventListener("click", () => runTool(key));
}

async function runTool(key) {
  const inputEl = document.getElementById("tool-input");
  const textEl = document.getElementById("tool-text");
  const input = inputEl ? inputEl.value.trim() : "";
  const text = textEl ? textEl.value : "";

  if (key === "keywords") {
    if (!input) return showWarn("Enter a seed keyword.");
    const mods = ["price","cost","in Pakistan","near me","for home","installation cost","with battery","without battery","latest rates","buying guide","comparison","benefits","maintenance","for beginners"];
    const ideas = [...mods.map(m => input + " " + m), "how much does " + input + " cost?", "what affects " + input + "?"];
    result.innerHTML = "<h4>Keyword ideas</h4><div class='keyword-table'>" +
      ideas.map(x => "<div class='kw-row'><span>" + esc(x) + "</span><b>Idea</b></div>").join("") +
      "</div><p class='good'>These are generated ideas, not live search metrics.</p>";
    result.hidden = false;
    return;
  }

  if (key === "youtube") {
    if (!input) return showWarn("Enter a video topic.");
    const topic = input.replace(/[.!?]+$/, "");
    const titles = [
      topic + " in Pakistan: Latest Prices & What to Know",
      topic + ": A Practical Buying Guide",
      topic + " Explained: Costs, Options and Tips"
    ];
    const keywords = [topic, topic + " in Pakistan", topic + " latest price", topic + " price guide", topic + " cost", topic + " buying guide"];
    const description = "In this video, we cover " + topic + ", key factors to compare, practical tips, and common questions. Verify current prices and availability before making a purchase.";
    result.innerHTML = "<h4>Title options</h4>" +
      titles.map(t => "<div class='kw-row'><span>" + esc(t) + "</span></div>").join("") +
      "<h4>Description</h4><pre>" + esc(description) + "</pre>" +
      "<h4>Keyword phrases</h4><div class='keyword-table'>" +
      keywords.map(k => "<div class='kw-row'><span>" + esc(k) + "</span></div>").join("") +
      "</div>";
    result.hidden = false;
    return;
  }

  if (key === "audit") {
    if (!text.trim()) return showWarn("Paste the page HTML first.");
    const doc = new DOMParser().parseFromString(text, "text/html");
    const checks = [
      ["Title tag", !!doc.querySelector("title")],
      ["Meta description", !!doc.querySelector('meta[name="description"]')],
      ["Canonical", !!doc.querySelector('link[rel="canonical"]')],
      ["One H1", doc.querySelectorAll("h1").length === 1],
      ["Viewport", !!doc.querySelector('meta[name="viewport"]')]
    ];
    result.innerHTML = "<h4>On-page audit</h4><ul class='check-list'>" +
      checks.map(c => "<li><strong>" + c[0] + ":</strong> <span class='" + (c[1] ? "good" : "warn") + "'>" + (c[1] ? "✓ Present" : "⚠ Missing") + "</span></li>").join("") +
      "</ul>";
    result.hidden = false;
    return;
  }

  if (key === "meta") {
    if (!input) return showWarn("Enter a page topic.");
    const keyword = (document.getElementById("tool-keyword") || {}).value || input;
    const description = "Learn about " + input + " with practical information, useful tips, and clear explanations.";
    const tags = '<title>' + input + ' | RankPilot</title>\n<meta name="description" content="' + description + '">\n<meta name="robots" content="index,follow">\n<meta property="og:title" content="' + input + ' | RankPilot">';
    result.innerHTML = "<h4>Generated tags</h4><pre>" + esc(tags) + "</pre><p><strong>Primary keyword:</strong> " + esc(keyword) + "</p>";
    result.hidden = false;
    return;
  }

  if (key === "density") {
    if (!input) return showWarn("Enter a target keyword.");
    if (!text.trim()) return showWarn("Paste your content first.");
    const words = text.toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) || [];
    const target = input.toLowerCase().match(/[a-z0-9]+/g) || [];
    let count = 0;
    for (let i = 0; i <= words.length - target.length; i++) {
      if (target.every((w, j) => words[i + j] === w)) count++;
    }
    const density = words.length ? (count * target.length / words.length * 100).toFixed(2) : "0.00";
    result.innerHTML = "<h4>Result</h4><p><strong>" + words.length + "</strong> words · <strong>" + count + "</strong> exact phrase occurrences · <strong>" + density + "%</strong> approximate density.</p>";
    result.hidden = false;
    return;
  }

  if (key === "sitemap") {
    const urls = text.split(/\r?\n/).map(x => x.trim()).filter(x => /^https?:\/\//i.test(x));
    if (!urls.length) return showWarn("Enter at least one valid URL.");
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => "  <url><loc>" + u.replace(/&/g, "&amp;") + "</loc></url>").join("\n") +
      "\n</urlset>";
    result.innerHTML = "<h4>XML sitemap</h4><pre>" + esc(xml) + "</pre><p class='good'>" + urls.length + " URL(s) included.</p>";
    result.hidden = false;
    return;
  }

  if (key === "bilibili") {
    if (!/^https?:\/\/(www\.)?bilibili\.com\//i.test(input)) return showWarn("Enter a valid Bilibili video URL.");
    const apiBase = (window.RANKPILOT_API_BASE || "").replace(/\/$/, "");
    if (!apiBase) return showWarn("Bilibili API is not configured.");
    const button = document.getElementById("run-tool");
    button.disabled = true;
    button.textContent = "Parsing...";
    result.hidden = false;
    result.innerHTML = "<p>Getting available video formats...</p>";
    try {
      const response = await fetch(apiBase + "/bilibili/parse", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({url: input})
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Downloader could not parse this video.");
      const formats = Array.isArray(data.formats) ? data.formats : [];
      if (!formats.length) throw new Error("No downloadable format was returned.");
      result.innerHTML = "<h4>" + esc(data.title || "Bilibili video") + "</h4><p class='good'>Available source formats:</p><div class='keyword-table'>" +
        formats.map(f => "<div class='kw-row'><span>" + esc(f.label || "Video") + "</span><a class='primary-small' href='" + esc(f.url) + "' target='_blank' rel='noopener'>Download</a></div>").join("") +
        "</div>";
    } catch (e) {
      showWarn(e.message || "Unable to connect to the Bilibili downloader.");
    } finally {
      button.disabled = false;
      button.textContent = "Get video";
    }
  }
}

document.querySelectorAll("[data-tool]").forEach(button => {
  button.addEventListener("click", () => openTool(button.dataset.tool));
});

const closeButton = document.querySelector(".modal-close");
const backdrop = document.querySelector(".modal-backdrop");
if (closeButton) closeButton.addEventListener("click", closeTool);
if (backdrop) backdrop.addEventListener("click", closeTool);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeTool(); });

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", nav.classList.contains("open"));
  });
}
