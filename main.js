/* ====================================================
   main.js — 毛泽东语录检索站交互逻辑
   功能：搜索匹配 / 主题浏览 / 随机语录 / 弹窗详情
   ==================================================== */

// ===================== 初始化 =====================
document.addEventListener("DOMContentLoaded", function () {
  renderCategories();
  showRandom();

  // 支持回车触发搜索
  const input = document.getElementById("main-input");
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSearch();
      }
    });
  }
});

// ===================== 搜索匹配核心逻辑 =====================

const MIN_RESULTS = 3;  // 最少展示条数

/**
 * 语义扩展：把用户口语/方言/情绪词扩展成系统能识别的标准意图词
 * 返回扩展后的查询串（原词 + 所有匹配到的 dst 词，用空格拼接）
 */
function expandQuery(raw) {
  if (!SYNONYM_MAP || !SYNONYM_MAP.length) return raw;
  const extra = new Set();
  const rawLower = raw.toLowerCase();
  for (const entry of SYNONYM_MAP) {
    for (const srcWord of entry.src) {
      if (rawLower.includes(srcWord.toLowerCase())) {
        entry.dst.forEach(d => extra.add(d));
        break; // 一个 src 命中即可，不重复扫
      }
    }
  }
  if (extra.size === 0) return raw;
  return raw + " " + [...extra].join(" ");
}

/**
 * 主搜索入口
 */
function doSearch() {
  const input = document.getElementById("main-input");
  const query = (input.value || "").trim();

  if (!query) {
    showToast("请先输入问题或关键词");
    input.focus();
    return;
  }

  // ★ 先做语义扩展，把口语词翻译成标准意图词再去匹配
  const expandedQuery = expandQuery(query);
  const queryLower = expandedQuery.toLowerCase();

  // Step1：找匹配的 category_lv1 列表（按相关度排序）
  const matchedCategories = matchIntentToCategories(queryLower);

  // Step2：在匹配分类内打分排序
  let scored = scoreQuotes(queryLower, matchedCategories);

  // Step3：不足 MIN_RESULTS 条时，从匹配到的主题里直接补充（不碰无关主题）
  if (scored.length < MIN_RESULTS && matchedCategories.length > 0) {
    scored = padWithSameCategories(scored, matchedCategories, MIN_RESULTS);
  }

  // Step4：仍不足，做全库关键词打分补充（还是先排除已有的）
  if (scored.length < MIN_RESULTS) {
    const expanded = scoreQuotes(queryLower, []);
    const existingIds = new Set(scored.map(q => q.id));
    for (const q of expanded) {
      if (!existingIds.has(q.id)) scored.push(q);
      if (scored.length >= MIN_RESULTS) break;
    }
  }

  // Step5：依然不足（输入词完全无关），从匹配主题内随机兜底；若无主题，用精选兜底
  if (scored.length < MIN_RESULTS) {
    scored = padWithSameCategories(scored, matchedCategories.length > 0 ? matchedCategories : ["逆境奋斗", "革命乐观主义", "艰苦奋斗"], MIN_RESULTS);
  }
  if (scored.length === 0) {
    scored = getFallbackQuotes();
  }

  const results = scored.slice(0, 12);
  renderResultSection(query, matchedCategories, results);
}

/**
 * 根据输入文本，映射到推荐 category_lv1 列表
 * 规则：
 *   - 只用长度 >= 2 的关键词匹配，彻底避免单字泛化
 *   - 关键词越长得分越高（越精准）
 *   - INTENT_MAP 中靠前的条目（高优先级）额外加权
 *   - 按总得分排序返回，分数最高的类别排最前面
 */
function matchIntentToCategories(queryLower) {
  const scores = {}; // category => 累计分数

  INTENT_MAP.forEach((intentItem, intentIndex) => {
    let intentScore = 0;
    // intentIndex 越小（排在越前面），表示优先级越高，给额外加权
    const priorityBonus = Math.max(0, 10 - intentIndex); // 前10个条目有优先权重

    for (const kw of intentItem.keywords) {
      if (kw.length >= 2 && queryLower.includes(kw)) {
        // 关键词长度越长、越精准，得分越高
        intentScore += kw.length * 2 + priorityBonus;
      }
    }

    if (intentScore > 0) {
      intentItem.categories.forEach(c => {
        scores[c] = (scores[c] || 0) + intentScore;
      });
    }
  });

  // 同时直接匹配 category 名称（用户直接输了主题名）
  for (const cat of CATEGORIES) {
    if (queryLower.includes(cat.id) || queryLower.includes(cat.label)) {
      scores[cat.id] = (scores[cat.id] || 0) + 50; // 直接命中主题名，高分
    }
  }

  // 按分数降序，只返回有分的类别
  return Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
}

/**
 * 给每条语录打分
 * 规则：
 *   - 主题命中：该语录的 category_lv1 在推荐列表里，高分
 *   - 主题排名越前，分越高（最相关的类给最高分）
 *   - query_keywords 命中：关键词越长加分越多
 *   - tags / scenes 辅助加分
 *   - 原文直接包含查询词：最高分（用户原话命中）
 */
function scoreQuotes(queryLower, preferCategories) {
  const results = [];

  for (const q of QUOTES_DATA) {
    let score = 0;

    // 主题命中：按在 preferCategories 里的排名给分（第1位得分最高）
    const catRank = preferCategories.indexOf(q.category_lv1);
    if (catRank >= 0) {
      score += Math.max(60 - catRank * 8, 20); // 第1位+60，第2位+52，...最低+20
    }

    // query_keywords 命中（关键词须>=2字，按长度加权）
    for (const kw of (q.query_keywords || [])) {
      if (kw.length >= 2 && queryLower.includes(kw)) {
        score += 8 + kw.length * 2;
      }
    }

    // tags 命中
    for (const tag of (q.tags || [])) {
      if (tag.length >= 2 && (queryLower.includes(tag) || tag.includes(queryLower))) {
        score += 5 + tag.length;
      }
    }

    // scenes 命中（场景关键词>=3字才算，减少误匹配）
    for (const sc of (q.scenes || [])) {
      if (sc.length >= 3 && queryLower.includes(sc)) {
        score += 8;
      }
    }

    // 原文直接包含查询词（最高权重，查询词须>=2字）
    if (queryLower.length >= 2 && q.quote.includes(queryLower)) {
      score += 35;
    }

    // category_lv2 命中（须>=3字）
    if (q.category_lv2 && q.category_lv2.length >= 3 && queryLower.includes(q.category_lv2)) {
      score += 12;
    }

    if (score > 0) results.push({ quote: q, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.map(r => r.quote);
}

/**
 * 从指定主题列表中补充语录，直到达到 minCount 条
 * 按主题优先级顺序取，同主题内随机打散，避免总取同几条
 */
function padWithSameCategories(existing, categories, minCount) {
  const existingIds = new Set(existing.map(q => q.id));
  const pool = [];

  // 按 categories 顺序（相关度从高到低）收集候选语录
  for (const cat of categories) {
    const inCat = QUOTES_DATA.filter(q => q.category_lv1 === cat && !existingIds.has(q.id));
    // 同一主题内轻微随机打散，避免每次都取一样的
    for (let i = inCat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [inCat[i], inCat[j]] = [inCat[j], inCat[i]];
    }
    pool.push(...inCat);
  }

  const result = [...existing];
  for (const q of pool) {
    if (result.length >= minCount) break;
    if (!existingIds.has(q.id)) {
      result.push(q);
      existingIds.add(q.id);
    }
  }
  return result;
}

/**
 * 最终兜底：输入词完全无法匹配时，返回精选推荐
 * 优先从「逆境奋斗、乐观信心、艰苦奋斗」取，比调查研究更通用
 */
function getFallbackQuotes() {
  return padWithSameCategories([], ["逆境奋斗", "革命乐观主义", "艰苦奋斗", "革命英雄主义", "青年", "学习"], MIN_RESULTS);
}


// ===================== 渲染结果区 =====================

function renderResultSection(query, categories, quotes) {
  const section = document.getElementById("result-section");
  const queryText = document.getElementById("result-query-text");
  const themesWrap = document.getElementById("result-themes-wrap");
  const quotesList = document.getElementById("result-quotes-list");
  const emptyTip = document.getElementById("result-empty");

  section.style.display = "block";
  queryText.textContent = query;

  // 渲染主题标签
  themesWrap.innerHTML = "";
  if (categories.length > 0) {
    const label = document.createElement("span");
    label.className = "result-themes-label";
    label.textContent = "匹配主题：";
    themesWrap.appendChild(label);

    categories.forEach(cat => {
      const catInfo = CATEGORIES.find(c => c.id === cat);
      const badge = document.createElement("span");
      badge.className = "theme-badge";
      badge.textContent = catInfo ? `${catInfo.icon} ${catInfo.label}` : cat;
      themesWrap.appendChild(badge);
    });
  } else {
    // 没有精确主题匹配时，提示为推荐
    const label = document.createElement("span");
    label.className = "result-themes-label";
    label.textContent = "💡 为你推荐相关语录";
    label.style.color = "#b7963a";
    label.style.fontWeight = "600";
    themesWrap.appendChild(label);
  }

  // 渲染语录卡片
  quotesList.innerHTML = "";
  if (quotes.length === 0) {
    emptyTip.style.display = "block";
  } else {
    emptyTip.style.display = "none";
    quotes.forEach(q => {
      quotesList.appendChild(buildQuoteCard(q));
    });
  }

  // 平滑滚动到结果区
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===================== 主题分类渲染 =====================

function renderCategories() {
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  grid.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const count = QUOTES_DATA.filter(q => q.category_lv1 === cat.id).length;
    const card = document.createElement("div");
    card.className = "category-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `查看${cat.label}主题语录`);
    card.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.label}</span>
      <span class="category-desc">${cat.desc}</span>
      <span class="category-count">${count} 条语录</span>
    `;
    card.addEventListener("click", () => openCategoryDetail(cat));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") openCategoryDetail(cat);
    });
    grid.appendChild(card);
  });
}

function openCategoryDetail(cat) {
  const section = document.getElementById("category-detail-section");
  const title = document.getElementById("category-detail-title");
  const list = document.getElementById("category-detail-quotes");

  title.textContent = `${cat.icon} ${cat.label}`;
  list.innerHTML = "";

  const quotes = QUOTES_DATA.filter(q => q.category_lv1 === cat.id);
  quotes.forEach(q => list.appendChild(buildQuoteCard(q)));

  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCategoryDetail() {
  const section = document.getElementById("category-detail-section");
  section.style.display = "none";
  document.getElementById("categories-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===================== 语录卡片构建 =====================

function buildQuoteCard(q) {
  const catInfo = CATEGORIES.find(c => c.id === q.category_lv1);
  const card = document.createElement("article");
  card.className = "quote-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `查看语录详情`);

  const isLong = q.quote.length > 50;

  // 智能拆分出处和时间：
  // source 可能是 "《文章名》（日期）" 或 "（日期）" 或 "《文章名》"
  const sourceStr = q.source || "";
  const dateStr = q.date || "";
  // 提取书名部分（《...》之间的内容）
  const bookMatch = sourceStr.match(/《([^》]+)》/);
  const bookTitle = bookMatch ? bookMatch[1] : "";
  // 构建出处显示文本
  let sourceDisplay = "";
  if (bookTitle) {
    sourceDisplay = `📚 《${bookTitle}》`;
  } else if (sourceStr && !sourceStr.match(/^[（(][\d年月日\s]+[）)]$/)) {
    // source 不是纯括号日期，有实质内容
    sourceDisplay = `📚 ${sourceStr}`;
  } else {
    sourceDisplay = `📚 毛泽东语录`;
  }

  card.innerHTML = `
    <div class="quote-card-category">
      ${catInfo ? catInfo.icon : "📖"} ${q.category_lv1}
    </div>
    <div class="quote-card-text${isLong ? " clamped" : ""}">
      ${escapeHtml(q.quote)}
    </div>
    <div class="quote-card-meta">
      <span class="quote-card-source">${escapeHtml(sourceDisplay)}</span>
      <span class="quote-card-date">🗓 ${escapeHtml(dateStr)}</span>
    </div>
  `;

  card.addEventListener("click", () => openModal(q));
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") openModal(q);
  });

  return card;
}

// ===================== 弹窗 =====================

let currentQuote = null;

function openModal(q) {
  currentQuote = q;
  const modal = document.getElementById("quote-modal");
  const catInfo = CATEGORIES.find(c => c.id === q.category_lv1);

  document.getElementById("modal-category").textContent =
    `${catInfo ? catInfo.icon : "📖"} ${q.category_lv1} · ${q.category_lv2 || ""}`;
  document.getElementById("modal-quote-text").textContent = q.quote;
  // 弹窗出处：提取书名或显示原始 source；时间单独一行
  const modalSrc = q.source || "";
  const modalBookMatch = modalSrc.match(/《([^》]+)》/);
  let modalSourceLabel = "";
  if (modalBookMatch) {
    modalSourceLabel = `📚 出处：《${modalBookMatch[1]}》`;
  } else if (modalSrc && !modalSrc.match(/^[（(][\d年月日\s]+[）)]$/)) {
    modalSourceLabel = `📚 出处：${modalSrc}`;
  } else {
    modalSourceLabel = `📚 出处：毛泽东语录`;
  }
  document.getElementById("modal-source").textContent = modalSourceLabel;
  document.getElementById("modal-date").textContent = `🗓 时间：${q.date}`;

  // 标签
  const tagsEl = document.getElementById("modal-tags");
  tagsEl.innerHTML = "";
  (q.tags || []).forEach(tag => {
    const span = document.createElement("span");
    span.className = "modal-tag-item";
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeModal(e) {
  if (e.target === document.getElementById("quote-modal")) {
    closeModalDirect();
  }
}

function closeModalDirect() {
  document.getElementById("quote-modal").style.display = "none";
  document.body.style.overflow = "";
  currentQuote = null;
}

function copyQuote() {
  if (!currentQuote) return;
  const text = `${currentQuote.quote}\n——${currentQuote.source}（${currentQuote.date}）`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("modal-copy-btn");
    btn.textContent = "✅ 已复制";
    setTimeout(() => { btn.textContent = "📋 复制原文"; }, 2000);
  }).catch(() => {
    // 降级处理
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    const btn = document.getElementById("modal-copy-btn");
    btn.textContent = "✅ 已复制";
    setTimeout(() => { btn.textContent = "📋 复制原文"; }, 2000);
  });
}

// ESC 关闭弹窗
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const modal = document.getElementById("quote-modal");
    if (modal && modal.style.display !== "none") closeModalDirect();
  }
});

// ===================== 随机语录 =====================

let lastRandomId = -1;

function showRandom() {
  let idx;
  do {
    idx = Math.floor(Math.random() * QUOTES_DATA.length);
  } while (idx === lastRandomId && QUOTES_DATA.length > 1);
  lastRandomId = idx;

  const q = QUOTES_DATA[idx];
  const textEl = document.getElementById("random-quote-text");
  const metaEl = document.getElementById("random-quote-meta");

  if (!textEl || !metaEl) return;

  // 淡入动画
  textEl.style.opacity = "0";
  metaEl.style.opacity = "0";
  setTimeout(() => {
    textEl.textContent = q.quote;
    metaEl.textContent = `${q.source}  ${q.date}`;
    textEl.style.transition = "opacity .4s";
    metaEl.style.transition = "opacity .4s";
    textEl.style.opacity = "1";
    metaEl.style.opacity = "1";
  }, 200);
}

// ===================== 工具函数 =====================

function fillAndSearch(text) {
  const input = document.getElementById("main-input");
  if (input) {
    input.value = text;
    doSearch();
  }
}

function clearSearch() {
  const input = document.getElementById("main-input");
  if (input) input.value = "";
  document.getElementById("result-section").style.display = "none";
  input.focus();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(msg) {
  let toast = document.getElementById("toast-el");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-el";
    toast.style.cssText = `
      position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
      background:#1a1a1a; color:#f0e6d0; padding:10px 22px;
      border-radius:999px; font-size:14px; z-index:9999;
      box-shadow:0 4px 16px rgba(0,0,0,.3);
      transition: opacity .3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, 2200);
}
