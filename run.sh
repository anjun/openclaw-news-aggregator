#!/bin/bash

# News Aggregator - 新闻聚合器运行脚本
# 用法：bash run.sh [类别] [输出方式]
# 类别：tech_cn, mil_cn, tech_global, mil_global, all (默认：all)
# 输出方式：console, file, feishu (默认：console)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 加载 Tavily API Key
export TAVILY_API_KEY=$(cat ~/.openclaw/secrets.json | grep -A1 '"tavily"' | tail -1 | cut -d'"' -f4)

# 默认参数
CATEGORIES="${1:-all}"
OUTPUT_MODE="${2:-console}"

# 解析类别
if [ "$CATEGORIES" = "all" ]; then
  CATEGORIES="tech_cn mil_cn tech_global"
fi

echo "🚀 开始聚合新闻..."
echo "📂 类别：$CATEGORIES"
echo "📤 输出：$OUTPUT_MODE"
echo ""

# 运行聚合脚本
node scripts/aggregate_news.js $CATEGORIES

echo ""
echo "✅ 新闻聚合完成！"
