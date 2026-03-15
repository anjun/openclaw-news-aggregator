#!/usr/bin/env node

/**
 * News Aggregator - 新闻聚合器（飞书集成版）
 * 
 * 功能：聚合新闻 + 内容总结 + 飞书文档推送
 * 参考：TrendRadar (48.9k stars) - https://github.com/sansan0/TrendRadar
 * 
 * 使用：
 * - node scripts/aggregate_news.js [类别] [数量]
 * - 飞书环境自动创建文档并发送链接
 * - 本地 output 只保留最近 10 个文件
 */

import { execSync } from 'child_process';
import { writeFileSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

const NEWS_SOURCES = {
  finance: [
    '财联社 最新电报',
    '华尔街见闻 实时新闻',
    '第一财经 财经新闻',
    '21 世纪经济报道 最新'
  ],
  tech_cn: [
    '36 氪 最新科技新闻',
    '机器之心 AI 进展',
    '量子位 人工智能动态',
    'IT 之家 科技快讯'
  ],
  hot_cn: [
    '微博 今日热搜',
    '知乎 今日热榜',
    'B 站 今日热门',
    '百度 今日热搜'
  ],
  mil_cn: [
    '观察者网 军事',
    '澎湃新闻 军事',
    '腾讯军事新闻'
  ],
  tech_global: [
    'TechCrunch latest news',
    'The Verge tech news',
    'Wired technology'
  ]
};

const OUTPUT_DIR = join(process.cwd(), 'output');
const MAX_FILES = 10;

/**
 * 搜索新闻
 */
function searchNews(query, limit = 10) {
  try {
    const TAVILY_KEY = process.env.TAVILY_API_KEY || 
      JSON.parse(execSync('cat ~/.openclaw/secrets.json', { encoding: 'utf-8' }).match(/"tavily":\s*\{[^}]*"apiKey":\s*"([^"]+)"/)?.[1]);
    
    process.env.TAVILY_API_KEY = TAVILY_KEY;
    
    const result = execSync(
      `node ~/.openclaw/workspace/skills/liang-tavily-search/scripts/search.mjs "${query}" -n ${limit} --time-range day`,
      { encoding: 'utf-8', env: { ...process.env, TAVILY_API_KEY: TAVILY_KEY } }
    );
    
    return parseSearchResults(result);
  } catch (error) {
    console.error(`搜索失败 "${query}": ${error.message}`);
    return [];
  }
}

/**
 * 解析搜索结果
 */
function parseSearchResults(output) {
  const results = [];
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('- **') && line.includes('** (relevance:')) {
      const title = line.match(/\*\*(.+?)\*\*/)?.[1];
      const relevance = line.match(/relevance:\s*(\d+)%/)?.[1];
      
      if (title && !title.includes('Sources')) {
        const urlLine = lines[i + 1];
        const url = urlLine?.match(/https?:\/\/[^\s]+/)?.[0];
        
        const descLine = lines[i + 2];
        const description = descLine && !descLine.includes('relevance') ? descLine.trim() : '';
        
        if (title && url) {
          results.push({ title, url, description, relevance: parseInt(relevance) || 0 });
        }
      }
    }
  }
  
  return results;
}

/**
 * 用 Jina Reader 获取网页内容
 */
function fetchContent(url) {
  try {
    if (url.match(/youtube|bilibili|douyin|x\.com|twitter|instagram|facebook|podcasts\.apple/)) {
      return null;
    }
    
    const jinaUrl = `https://r.jina.ai/${url}`;
    const content = execSync(`curl -s --max-time 8 "${jinaUrl}"`, { 
      encoding: 'utf-8',
      timeout: 10000
    });
    
    if (content && content.length > 200) {
      return content;
    }
  } catch (error) {
    // 静默失败
  }
  return null;
}

/**
 * 提取关键要点
 */
function extractKeyPoints(content, title) {
  if (!content) return { summary: '暂无详细内容', points: [] };
  
  const lines = content.split('\n')
    .map(l => l.trim())
    .filter(l => {
      if (l.length < 20 || l.length > 300) return false;
      if (l.match(/登录 | 注册 | 下载|APP|关于我们 | 网站地图 | 联系我们 | 版权声明/)) return false;
      if (l.match(/^https?:\/\//)) return false;
      return true;
    });
  
  const keySentences = lines.filter(line => {
    return line.match(/\d+|发布 | 宣布 | 表示 | 指出 | 增长 | 下降 | 突破 | 达到 | 预计/) && 
           !line.includes('Title:') && 
           !line.includes('URL Source:');
  });
  
  const unique = [...new Set(keySentences)].slice(0, 5);
  
  const timeMatch = content.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?|\d{1,2}月\d{1,2}日|\d{1,2}小时前|\d{1,2}分钟前|今天 | 昨日)/);
  const time = timeMatch ? timeMatch[0] : '今日';
  
  const numbers = content.match(/\d+[\d.,]*[%亿元万]?/g) || [];
  const keyNumbers = [...new Set(numbers)].slice(0, 5).join(', ');
  
  return {
    summary: unique.join('\n• ') || '暂无详细内容',
    points: unique,
    time,
    keyNumbers: keyNumbers || '无'
  };
}

/**
 * 去重并排序
 */
function filterNews(results, limit = 10) {
  const seen = new Set();
  const unique = results.filter(item => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  unique.sort((a, b) => b.relevance - a.relevance);
  return unique.slice(0, limit);
}

/**
 * 聚合新闻
 */
function aggregateNews(categories = ['finance'], itemsPerCategory = 10) {
  const aggregated = {};
  
  for (const category of categories) {
    console.log(`📰 搜索 ${category}...`);
    const sources = NEWS_SOURCES[category];
    
    if (!sources) {
      console.warn(`⚠️ 未知类别：${category}`);
      continue;
    }
    
    const allResults = [];
    
    for (const source of sources) {
      console.log(`  🔍 ${source}...`);
      const results = searchNews(source, Math.ceil(itemsPerCategory / sources.length) + 2);
      allResults.push(...results);
    }
    
    const filtered = filterNews(allResults, itemsPerCategory);
    
    console.log(`  📖 获取内容...`);
    aggregated[category] = filtered.map(item => {
      const content = fetchContent(item.url);
      const keypoints = extractKeyPoints(content, item.title);
      return { ...item, keypoints };
    });
  }
  
  return aggregated;
}

/**
 * 生成文档内容（Markdown 格式）
 */
function generateDocContent(aggregated) {
  const categoryNames = {
    tech_cn: '🇨🇳 国内科技',
    finance: '💰 财经',
    hot_cn: '🔥 国内热搜',
    mil_cn: '🇨🇳 国内军事',
    tech_global: '🌍 国际科技'
  };
  
  let content = `# 📰 新闻聚合报告\n\n`;
  content += `**更新时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
  content += `**新闻源**: 参考 TrendRadar (48.9k stars) - 35+ 平台\n\n`;
  content += `---\n\n`;
  
  for (const [category, items] of Object.entries(aggregated)) {
    content += `## ${categoryNames[category] || category}\n\n`;
    
    if (items.length === 0) {
      content += `_(暂无新闻)_\n\n`;
      continue;
    }
    
    items.forEach((item, index) => {
      content += `### ${index + 1}. ${item.title}\n\n`;
      content += `**来源**: ${new URL(item.url).hostname} | **时间**: ${item.keypoints.time} | **相关度**: ${item.relevance}%\n\n`;
      
      if (item.keypoints.points.length > 0) {
        content += `**要点**:\n`;
        item.keypoints.points.forEach((point) => {
          content += `• ${point}\n`;
        });
        content += `\n`;
      } else {
        content += `**摘要**: ${item.keypoints.summary}\n\n`;
      }
      
      if (item.keypoints.keyNumbers !== '无') {
        content += `**关键数据**: ${item.keypoints.keyNumbers}\n\n`;
      }
      
      content += `[🔗 阅读原文](${item.url})\n\n`;
      content += `---\n\n`;
    });
  }
  
  content += `_本报告由 News Aggregator 自动生成_`;
  
  return content;
}

/**
 * 保存本地文件
 */
function saveLocalFile(content) {
  const timestamp = Date.now();
  const outputPath = join(OUTPUT_DIR, `news-${timestamp}.md`);
  
  try {
    writeFileSync(outputPath, content, 'utf-8');
    console.log(`💾 本地备份：${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`❌ 保存失败：${error.message}`);
    return null;
  }
}

/**
 * 清理旧文件（只保留最近 10 个）
 */
function cleanupOldFiles() {
  try {
    const { existsSync } = require('fs');
    if (!existsSync(OUTPUT_DIR)) {
      return;
    }
    
    const files = readdirSync(OUTPUT_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        time: statSync(join(OUTPUT_DIR, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > MAX_FILES) {
      console.log(`🧹 清理旧文件（保留最近${MAX_FILES}个）...`);
      
      files.slice(MAX_FILES).forEach(file => {
        const filePath = join(OUTPUT_DIR, file.name);
        unlinkSync(filePath);
        console.log(`  删除：${file.name}`);
      });
      
      console.log(`✅ 清理完成，保留 ${files.slice(0, MAX_FILES).length} 个文件`);
    }
  } catch (error) {
    console.error(`⚠️ 清理文件失败：${error.message}`);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const categories = args.length > 0 ? args : ['finance'];
  
  console.log('🚀 开始聚合新闻（飞书集成版）...\n');
  
  // 1. 聚合新闻
  const aggregated = aggregateNews(categories, 10);
  
  // 2. 生成内容
  const content = generateDocContent(aggregated);
  
  // 3. 保存本地文件
  const localPath = saveLocalFile(content);
  
  // 4. 清理旧文件
  cleanupOldFiles();
  
  // 5. 输出飞书文档创建指令
  const timestamp = new Date().toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false
  }).replace(/[/:\s]/g, '-');
  
  const title = `📰 新闻聚合 ${timestamp}`;
  
  console.log(`\n📄 文档标题：${title}`);
  console.log(`\n✅ 新闻聚合完成！`);
  console.log(`\n⚠️ 飞书文档需要通过 feishu_doc 工具创建，请在 OpenClaw 中调用:`);
  console.log(`   feishu_doc action=create title="${title}" content="..." `);
  
  // 输出到 stdout 供 OpenClaw 捕获
  console.log(`\n[FEISHU_DOC_REQUEST]`);
  console.log(`title=${title}`);
  console.log(`content_start`);
  console.log(content);
  console.log(`content_end`);
  console.log(`[/FEISHU_DOC_REQUEST]`);
}

main();
