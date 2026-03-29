/**
 * CodeRecall — Content Script
 * Runs on supported CP platform pages.
 * Scrapes title, platform, and topic tags.
 */

const PLATFORM_SCRAPERS = {
  'leetcode.com': {
    platform: 'LeetCode',
    getTitle: () => {
      const selectors = [
        '[data-cy="question-title"]',
        '.text-title-large a',
        'div.flex-1 span.text-lg',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) return el.textContent.trim();
      }
      const match = document.title.match(/^(.+?)\s*[-–—|]\s*LeetCode/i);
      return match ? match[1].trim() : document.title.replace(/\s*[-–—|]\s*LeetCode.*$/i, '').trim();
    },
    getTags: () => {
      // LeetCode renders tags via React — try multiple selector patterns for old & new UI
      const selectors = [
        'a[href*="/tag/"]',                          // new UI topic tag links
        'a[href*="topicSlugs"]',                     // alternative URL format
        '[class*="topic-tag"] a',                    // class-based (old UI)
        '[class*="topicTag"] a',                     // camelCase variant
        'div[class*="tag"] a[class*="tag"]',          // nested tag links
        '.css-10o4yqd a',                            // legacy classname
      ];
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length) {
          const tags = Array.from(els)
            .map(el => el.textContent.trim().toLowerCase())
            .filter(t => t && t.length > 1 && t.length < 40);
          if (tags.length) return tags;
        }
      }
      return [];
    }
  },

  'codeforces.com': {
    platform: 'Codeforces',
    getTitle: () => {
      const titleEl = document.querySelector('.problem-statement .title');
      if (titleEl?.textContent?.trim()) {
        return titleEl.textContent.trim().replace(/^[A-Z]\d*\.\s*/, '');
      }
      const match = document.title.match(/^Problem\s*[-–—]\s*(.+?)\s*[-–—]\s*Codeforces/i);
      return match ? match[1].trim() : document.title.replace(/\s*[-–—|]\s*Codeforces.*$/i, '').trim();
    },
    getTags: () => {
      // Codeforces tags are in .tag-box — may be hidden in a spoiler, click to reveal isn't needed
      const tagEls = document.querySelectorAll('.tag-box a');
      return Array.from(tagEls)
        .map(el => el.textContent.trim().toLowerCase().replace(/^x$/i, '').trim())
        .filter(t => t && t !== 'x' && t.length > 1);
    }
  },

  'codechef.com': {
    platform: 'CodeChef',
    getTitle: () => {
      const el = document.querySelector('h1') || document.querySelector('.breadcrumbs span:last-child');
      if (el?.textContent?.trim()) return el.textContent.trim();
      return document.title.replace(/\s*[-–—|]\s*CodeChef.*$/i, '').trim();
    },
    getTags: () => {
      // CodeChef shows tags/categories
      const tagEls = document.querySelectorAll('.tags a, .problem-tags a, [class*="tag"] a');
      return Array.from(tagEls)
        .map(el => el.textContent.trim().toLowerCase())
        .filter(Boolean);
    }
  },

  'hackerrank.com': {
    platform: 'HackerRank',
    getTitle: () => {
      const el = document.querySelector('.challenge-page-label-wrapper h1') ||
                 document.querySelector('.challenge-name-label');
      if (el?.textContent?.trim()) return el.textContent.trim();
      return document.title.replace(/\s*[-–—|]\s*HackerRank.*$/i, '').trim();
    },
    getTags: () => {
      // HackerRank skills/domains
      const tagEls = document.querySelectorAll('.tags-container a, .domain-name');
      return Array.from(tagEls)
        .map(el => el.textContent.trim().toLowerCase())
        .filter(Boolean);
    }
  },

  'hackerearth.com': {
    platform: 'HackerEarth',
    getTitle: () => {
      const el = document.querySelector('.title-panel h1') || document.querySelector('h1');
      if (el?.textContent?.trim()) return el.textContent.trim();
      return document.title.replace(/\s*[-–—|]\s*HackerEarth.*$/i, '').trim();
    },
    getTags: () => {
      const tagEls = document.querySelectorAll('.tags a, .problem-tags a');
      return Array.from(tagEls)
        .map(el => el.textContent.trim().toLowerCase())
        .filter(Boolean);
    }
  },

  'geeksforgeeks.org': {
    platform: 'GeeksforGeeks',
    getTitle: () => {
      const el = document.querySelector('.problems_header_content h3') ||
                 document.querySelector('h2.problem-tab__problem-title') ||
                 document.querySelector('h1');
      if (el?.textContent?.trim()) return el.textContent.trim();
      return document.title.replace(/\s*[-–—|]\s*(GeeksforGeeks|GFG).*$/i, '').trim();
    },
    getTags: () => {
      // GFG topic tags
      const tagEls = document.querySelectorAll(
        '.problem_tag_container a, .tags-container a, [class*="problem-tag"] a'
      );
      return Array.from(tagEls)
        .map(el => el.textContent.trim().toLowerCase())
        .filter(Boolean);
    }
  },

  'atcoder.jp': {
    platform: 'AtCoder',
    getTitle: () => {
      const el = document.querySelector('#task-statement h2') || document.querySelector('.h2');
      if (el?.textContent?.trim()) {
        return el.textContent.trim().replace(/^[A-Z]\d*\s*[-–—]\s*/, '');
      }
      const match = document.title.match(/^(.+?)\s*[-–—]\s*AtCoder/i);
      return match ? match[1].trim() : document.title.replace(/\s*[-–—|]\s*AtCoder.*$/i, '').trim();
    },
    getTags: () => [] // AtCoder doesn't show tags publicly
  },

  'topcoder.com': {
    platform: 'TopCoder',
    getTitle: () => {
      const el = document.querySelector('h1');
      if (el?.textContent?.trim()) return el.textContent.trim();
      return document.title.replace(/\s*[-–—|]\s*TopCoder.*$/i, '').trim();
    },
    getTags: () => []
  }
};

function detectPlatform() {
  const hostname = window.location.hostname.replace(/^www\./, '');
  for (const domain of Object.keys(PLATFORM_SCRAPERS)) {
    if (hostname === domain || hostname.endsWith('.' + domain)) {
      return PLATFORM_SCRAPERS[domain];
    }
  }
  return null;
}

function getPageData() {
  const scraper = detectPlatform();
  if (!scraper) return { supported: false };

  const tags = scraper.getTags ? scraper.getTags() : [];

  return {
    supported: true,
    title: scraper.getTitle() || '',
    url: window.location.href,
    platform: scraper.platform,
    tags: [...new Set(tags)].slice(0, 10) // deduplicate, max 10
  };
}

// Listen for requests from the popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'getPageData') {
    // Wait longer for SPAs like LeetCode to finish rendering tag elements
    setTimeout(() => {
      sendResponse(getPageData());
    }, 800);
    return true;
  }
});
