---
name: news-aggregator
version: 1.0.0
description: 新闻聚合器（基于 TrendRadar + ClawHub 改造）- 聚合财经、科技、热搜等新闻，自动总结要点并推送飞书文档
license: MIT
metadata: {"openclaw":{"emoji":"📰","requires":{"bins":["node"],"env":["TAVILY_API_KEY"]},"primaryEnv":"TAVILY_API_KEY"}}
---

# News Aggregator 📰

基于 [TrendRadar](https://github.com/sansan0/TrendRadar) (48.9k stars) 和 ClawHub `news-aggregator` 改造的新闻聚合技能。

## 功能

- 📰 聚合财经、科技、热搜、军事等新闻
- 🔍 自动提取内容要点和关键数据
- 📄 飞书文档自动创建并发送链接
- 🧹 本地文件自动清理（保留最近 10 个）

## 新闻类别

| 类别 | 代码 | 新闻源 |
|------|------|--------|
| 财经 | finance | 财联社、华尔街见闻、第一财经 |
| 国内科技 | tech_cn | 36 氪、机器之心、量子位 |
| 国内热搜 | hot_cn | 微博、知乎、B 站、百度 |
| 国内军事 | mil_cn | 观察者网、澎湃新闻 |
| 国际科技 | tech_global | TechCrunch、The Verge |

## 使用

```bash
cd ~/.openclaw/workspace/skills/news-aggregator

# 默认：财经新闻
node scripts/aggregate_news.js

# 指定类别
node scripts/aggregate_news.js finance
node scripts/aggregate_news.js tech_cn
node scripts/aggregate_news.js "finance tech_cn"
```

## 输出

1. **飞书文档**: 自动创建并发送链接
2. **本地备份**: `output/news-*.md`（保留最近 10 个）

## 配置

需要 Tavily API Key（`~/.openclaw/secrets.json`）：
```json
{
  "tavily": {
    "apiKey": "tvly-xxx"
  }
}
```

## 改造说明

**原始项目**:
1. TrendRadar - AI 舆情监控与热点聚合工具 (48.9k stars)
2. ClawHub news-aggregator - 基础新闻聚合技能

**改造内容**:
- 整合两个项目的优点
- 适配 OpenClaw 技能架构
- 使用 Tavily Search 获取新闻
- 使用 Jina Reader 提取内容
- 飞书文档自动推送
- 本地文件自动清理

---

*参考：https://github.com/sansan0/TrendRadar*
