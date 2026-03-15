# 📰 OpenClaw News Aggregator

基于 [TrendRadar](https://github.com/sansan0/TrendRadar) (48.9k stars) 和 ClawHub `news-aggregator` 技能改造的 OpenClaw 新闻聚合技能。

## 🔧 改造说明

**原始项目**:
1. **TrendRadar** - AI 驱动的舆情监控与热点聚合工具（48.9k stars）
2. **ClawHub news-aggregator** - 基础新闻聚合技能

**改造内容**:
- ✅ 整合两个项目的优点
- ✅ 适配 OpenClaw 技能架构
- ✅ 使用 Tavily Search API 获取新闻
- ✅ 使用 Jina Reader 提取网页内容
- ✅ 自动创建飞书文档并发送链接
- ✅ 本地文件自动清理（保留最近 10 个）
- ✅ 内容智能总结（要点 + 关键数据 + 时间）

## ✨ 功能特性

- 📰 **多类别新闻聚合**: 财经、科技、热搜、军事等
- 🔍 **内容总结**: 自动提取要点、关键数据、时间
- 📄 **飞书集成**: 自动创建飞书文档并发送链接
- 🧹 **自动清理**: 本地只保留最近 10 个文件
- 📊 **参考 TrendRadar**: 35+ 平台新闻源配置

## 📦 安装

### 从 GitHub 克隆（推荐）

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/anjun/openclaw-news-aggregator.git news-aggregator
```

### 更新技能

```bash
cd ~/.openclaw/workspace/skills/news-aggregator
git pull origin main
```

## 🚀 使用

### 基本用法

```bash
cd ~/.openclaw/workspace/skills/news-aggregator

# 获取财经新闻（默认）
node scripts/aggregate_news.js

# 获取指定类别
node scripts/aggregate_news.js finance
node scripts/aggregate_news.js tech_cn
node scripts/aggregate_news.js hot_cn

# 获取多个类别
node scripts/aggregate_news.js "finance tech_cn"
```

### 新闻类别

| 类别代码 | 说明 | 新闻源 |
|----------|------|--------|
| `finance` | 💰 财经 | 财联社、华尔街见闻、第一财经、21 世纪经济 |
| `tech_cn` | 🇨🇳 国内科技 | 36 氪、机器之心、量子位、IT 之家 |
| `hot_cn` | 🔥 国内热搜 | 微博、知乎、B 站、百度 |
| `mil_cn` | 🇨🇳 国内军事 | 观察者网、澎湃新闻、腾讯军事 |
| `tech_global` | 🌍 国际科技 | TechCrunch、The Verge、Wired |

## 📋 输出

### 1. 飞书文档（自动创建）
- 标题：`📰 新闻聚合 YYYY-MM-DD`
- 内容：完整新闻报告（带要点总结）
- 链接：自动发送到飞书

### 2. 本地备份
- 路径：`output/news-*.md`
- 数量：自动保留最近 10 个文件

### 3. 输出格式示例

```markdown
# 📰 新闻聚合报告

## 💰 财经

### 1. 马斯克：TeraFab 工厂 7 天后启动
**来源**: 财联社 | **时间**: 3 月 14 日

**要点**:
• 马斯克宣布 TeraFab 工厂项目将在 7 天后启动
• 该项目对特斯拉生产至关重要

**关键数据**: 7 天

[🔗 阅读原文](链接)
```

## ⚙️ 配置

### Tavily API Key

需要在 `~/.openclaw/secrets.json` 中配置：

```json
{
  "tavily": {
    "apiKey": "tvly-xxx"
  }
}
```

### 飞书插件

确保已安装并启用飞书插件：

```bash
openclaw plugins enable feishu
```

## 📁 项目结构

```
news-aggregator/
├── README.md                # 使用说明
├── SKILL.md                 # 技能描述
├── _meta.json               # 元数据
├── run.sh                   # 运行脚本
├── scripts/
│   └── aggregate_news.js    # 主程序
├── output/                  # 输出目录（自动清理）
│   └── news-*.md
└── .gitignore
```

## 🔧 开发

### 添加新的新闻类别

编辑 `scripts/aggregate_news.js`，在 `NEWS_SOURCES` 中添加：

```javascript
const NEWS_SOURCES = {
  // ... 现有类别
  your_category: [
    '新闻源 1',
    '新闻源 2'
  ]
};
```

### 修改输出格式

编辑 `generateDocContent()` 函数。

## 📝 更新日志

### v1.0.0 (2026-03-15)
- ✅ 基于 TrendRadar + ClawHub news-aggregator 改造完成
- ✅ 支持 5 个新闻类别
- ✅ 飞书文档自动创建
- ✅ 本地文件自动清理
- ✅ 内容总结与要点提取

## 🙏 致谢

- **TrendRadar** ([GitHub](https://github.com/sansan0/TrendRadar)) - 新闻源配置参考
- **ClawHub news-aggregator** - 基础技能架构参考
- **Tavily** - 搜索 API 支持
- **Jina AI** - 网页内容提取

## 📄 许可证

MIT License

---

**作者**: 安俊  
**项目**: OpenClaw News Aggregator  
**基于**: TrendRadar (48.9k stars) + ClawHub news-aggregator  
**仓库**: https://github.com/anjun/openclaw-news-aggregator
