const modal=document.getElementById("tool-modal"),form=document.getElementById("tool-form"),result=document.getElementById("tool-result"),title=document.getElementById("modal-title"),copy=document.getElementById("modal-copy");
document.getElementById("year").textContent=new Date().getFullYear();

const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const clean=s=>String(s).trim().replace(/\s+/g," ");
const words=s=>(String(s).toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g)||[]);

const configs={
 keywords:{title:"Keyword Research",copy:"Generate practical long-tail keyword ideas from a seed. This is a starter ideation tool; validate volume and competition with a live data source before publishing.",html:'<label>Seed keyword</label><div class="form-row"><input class="input" id="tool-input" placeholder="e.g. seo tools"><button class="primary-small" id="run-tool">Research</button></div>'},
 youtube:{title:"YouTube SEO Planner",copy:"Build a video keyword, title, description, and tag plan from one topic.",html:'<label>Video topic</label><div class="form-row"><input class="input" id="tool-input" placeholder="e.g. keyword research tutorial"><button class="primary-small" id="run-tool">Plan</button></div>'},
 audit:{title:"Website SEO Audit",copy:"For a real client-side audit, paste your page HTML below. A URL alone cannot be crawled reliably from a browser because of cross-origin restrictions.",html:'<label>Page URL (optional)</label><input class="input" id="tool-input" placeholder="https://example.com"><label style="display:block;margin-top:14px">Page HTML (optional but recommended)</label><textarea class="input" id="tool-text" rows="9" placeholder="Paste the page HTML here..."></textarea><div class="form-row"><button class="primary-small" id="run-tool">Audit</button></div>'},
 meta:{title:"Meta Tag Generator",copy:"Generate a clean title, meta description, canonical tag, and social tags for a page.",html:'<label>Page topic</label><input class="input" id="tool-input" placeholder="e.g. Best SEO Tools for Beginners"><label style="display:block;margin-top:14px">Primary keyword</label><input class="input" id="tool-keyword" placeholder="e.g. free seo tools"><div class="form-row"><button class="primary-small" id="run-tool">Generate</button></div>'},
 density:{title:"Keyword Density",copy:"Measure exact phrase usage in your content and flag potentially excessive repetition.",html:'<textarea class="input" id="tool-text" rows="9" placeholder="Paste your content here..."></textarea><div class="form-row"><input class="input" id="tool-input" placeholder="Target keyword"><button class="primary-small" id="run-tool">Analyze</button></div>'},
 sitemap:{title:"Sitemap Helper",copy:"Generate a simple XML sitemap for multiple URLs.",html:'<textarea class="input" id="tool-text" rows="6" placeholder="One URL per line\nhttps://example.com/\nhttps://example.com/about"></textarea><div class="form-row"><button class="primary-small" id="run-tool">Generate</button></div>'}
};

function openTool(key){
 const c=configs[key]; if(!c)return;
 title.textContent=c.title; copy.textContent=c.copy; form.innerHTML=c.html; result.hidden=true; result.innerHTML="";
 modal.classList.add("open"); modal.setAttribute("aria-hidden","false");
 const btn=document.getElementById("run-tool"); if(btn)btn.onclick=()=>runTool(key);
}

function runTool(key){
 const input=clean(document.getElementById("tool-input")?.value||"");
 const textInput=document.getElementById("tool-text")?.value||"";
 let html="";

 if(key==="keywords"){
   if(!input){showWarn("Enter a seed keyword.");return;}
   const base=input.toLowerCase();
   const modifiers=["best","free","cheap","easy","for beginners","for small business","for bloggers","for agencies","online","tool","software","guide","tutorial","checklist","tips","strategy","examples"];
   const questions=["how to "+base,"what is "+base+"?","how does "+base+" work?","why use "+base+"?","how to choose "+base];
   const ideas=[...modifiers.map(m=>m+" "+base),...modifiers.map(m=>base+" "+m),...questions];
   const unique=[...new Set(ideas.map(clean))].slice(0,30);
   const intent=x=>/how|what|why/.test(x)?"Informational":/best|cheap|free|tool|software/.test(x)?"Commercial":/buy|price|cost/.test(x)?"Transactional":"Informational";
   html='<h4>Keyword ideas</h4><div class="keyword-table"><div class="kw-head"><span>Keyword</span><span>Intent</span></div>'+unique.map(x=>'<div class="kw-row"><span>'+esc(x)+'</span><b>'+intent(x)+'</b></div>').join("")+'</div><p class="good">Use the strongest phrases naturally in titles, H1s, headings, body copy, FAQs, and internal links. Do not repeat a keyword just to increase density.</p>';
 }

 if(key==="youtube"){
   if(!input){showWarn("Enter a video topic.");return;}
   const topic=clean(input), primary=topic.toLowerCase();
   const related=[primary+" tutorial",primary+" for beginners","how to "+primary,bestPhrase("best "+primary),primary+" tips",primary+" mistakes",primary+" step by step"];
   html='<h4>Video plan</h4><p><strong>Primary keyword:</strong> '+esc(primary)+'</p><p><strong>Title ideas</strong></p><ul class="check-list"><li>'+esc(toTitle("How to "+topic+" — Beginner Guide"))+'</li><li>'+esc(toTitle(topic+" Tips & Strategy That Actually Work"))+'</li><li>'+esc(toTitle(topic+" Step-by-Step Tutorial"))+'</li></ul><p><strong>Related phrases</strong></p><ul class="check-list">'+related.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul><p><strong>Description starter:</strong> Learn '+esc(primary)+' with a practical step-by-step workflow, useful tips, common mistakes, and examples.</p><p class="good">Put the primary topic naturally in the title and opening description; make the video satisfy the query rather than stuffing tags.</p>';
 }

 if(key==="audit"){
   const htmlText=textInput.trim();
   if(!htmlText){showWarn("Paste the page HTML so the browser can audit it.");return;}
   const doc=new DOMParser().parseFromString(htmlText,"text/html");
   const titleText=doc.querySelector("title")?.textContent.trim()||"";
   const desc=doc.querySelector('meta[name="description"]')?.getAttribute("content")||"";
   const canonical=doc.querySelector('link[rel="canonical"]')?.getAttribute("href")||"";
   const h1s=doc.querySelectorAll("h1").length;
   const viewport=!!doc.querySelector('meta[name="viewport"]');
   const images=[...doc.querySelectorAll("img")], missingAlt=images.filter(i=>!i.getAttribute("alt")?.trim()).length;
   const checks=[
    ["Title tag",!!titleText,titleText?esc(titleText):"Missing"],
    ["Meta description",!!desc,desc?esc(desc.length+" characters"):"Missing"],
    ["Canonical",!!canonical,canonical?esc(canonical):"Missing"],
    ["One H1",h1s===1,h1s+" H1 tag(s)"],
    ["Viewport",viewport,viewport?"Present":"Missing"],
    ["Image alt text",missingAlt===0,missingAlt+" image(s) missing alt text"]
   ];
   html='<h4>On-page audit</h4><ul class="check-list">'+checks.map(c=>'<li><strong>'+c[0]+':</strong> <span class="'+(c[1]?"good":"warn")+'">'+(c[1]?"✓ ":"⚠ ")+c[2]+'</span></li>').join("")+'</ul><p class="good">This audit runs locally in your browser; no page HTML is sent to RankPilot.</p>';
 }

 if(key==="meta"){
   if(!input){showWarn("Enter a page topic.");return;}
   const kw=clean(document.getElementById("tool-keyword")?.value||"");
   const topic=esc(input), keyword=esc(kw||input);
   const descText=esc("Learn "+input+" with practical tips, examples, tools, and clear guidance from RankPilot.");
   html='<h4>Generated tags</h4><pre>&lt;title&gt;'+topic+' | RankPilot&lt;/title&gt;\n&lt;meta name="description" content="'+descText+'"&gt;\n&lt;meta name="robots" content="index,follow"&gt;\n&lt;link rel="canonical" href="https://example.com/page"&gt;\n&lt;meta property="og:title" content="'+topic+' | RankPilot"&gt;\n&lt;meta property="og:description" content="'+descText+'"&gt;</pre><p><strong>Primary keyword:</strong> '+keyword+'</p><p class="good">Replace the example canonical URL with the real page URL before publishing.</p>';
 }

 if(key==="density"){
   const kw=input.toLowerCase();
   if(!kw){showWarn("Enter a target keyword.");return;}
   const ws=words(textInput), target=words(kw);
   if(!ws.length){showWarn("Paste some content first.");return;}
   let count=0;
   for(let i=0;i<=ws.length-target.length;i++)if(target.every((w,j)=>ws[i+j]===w))count++;
   const density=((count*target.length/ws.length)*100).toFixed(2);
   const flag=Number(density)>3?"<span class='warn'>High repetition — review for natural language.</span>":"<span class='good'>No obvious density warning.</span>";
   html='<h4>Result</h4><p><strong>'+ws.length+'</strong> words · <strong>'+count+'</strong> exact phrase occurrences · approximate density <strong>'+density+'%</strong></p><p>'+flag+'</p><p class="good">There is no universal ideal keyword density. Relevance and helpful content matter more than hitting a percentage.</p>';
 }

 if(key==="sitemap"){
   const urls=textInput.split(/\r?\n/).map(clean).filter(Boolean);
   if(!urls.length){showWarn("Enter at least one URL.");return;}
   const valid=urls.filter(u=>/^https?:\/\//i.test(u)).map(u=>u.replace(/\/$/,"")+"/");
   if(!valid.length){showWarn("Enter valid http or https URLs.");return;}
   html='<h4>XML sitemap</h4><pre>&lt;?xml version="1.0" encoding="UTF-8"?&gt;\n&lt;urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"&gt;\n'+valid.map(u=>'  &lt;url&gt;\n    &lt;loc&gt;'+esc(u)+'&lt;/loc&gt;\n  &lt;/url&gt;').join("\n")+'\n&lt;/urlset&gt;</pre><p class="good">'+valid.length+" URL(s) generated. Save as sitemap.xml and submit it in Search Console.</p>";
 }

 result.hidden=false; result.innerHTML=html;
}

function showWarn(msg){result.hidden=false;result.innerHTML="<p class='warn'>"+esc(msg)+"</p>";}
function toTitle(s){return s.replace(/\b\w/g,c=>c.toUpperCase())}
function bestPhrase(s){return s}

document.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>openTool(b.dataset.tool)));
document.querySelector(".modal-close").onclick=()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true")};
document.querySelector(".modal-backdrop").onclick=()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")modal.classList.remove("open")});
document.querySelector(".menu-toggle").onclick=()=>{const n=document.querySelector(".nav");n.classList.toggle("open");document.querySelector(".menu-toggle").setAttribute("aria-expanded",n.classList.contains("open"))};
document.querySelectorAll(".nav a").forEach(a=>a.onclick=()=>document.querySelector(".nav").classList.remove("open"));