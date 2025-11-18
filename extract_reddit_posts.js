/**
 * 清洗Reddit JSON数据，提取资讯列表
 * 提取字段：title、upvote_ratio、ups、permalink
 * 纯原生JavaScript实现，可在浏览器和Node.js环境中使用
 * 
 * @param {string|Object} param1 - JSON字符串或JSON对象
 * @returns {Array} 提取后的资讯列表数组
 */
function handler(param1) {
    var jsonData;
    
    // 如果传入的是字符串，先解析为JSON对象
    if (typeof param1 === 'string') {
        try {
            jsonData = JSON.parse(param1);
        } catch (e) {
            console.error('JSON解析失败:', e.message);
            return [];
        }
    } else {
        jsonData = param1;
    }
    
    // 检查数据格式
    if (!jsonData || !jsonData.data || !jsonData.data.children) {
        console.error('无效的数据格式');
        return [];
    }

    // 提取children数组
    var children = jsonData.data.children;
    
    // 遍历每个帖子，提取所需字段
    var posts = children
        .filter(function(child) {
            return child.kind === 't3' && child.data;
        })
        .map(function(child) {
            var data = child.data;
            return {
                title: data.title || '',
                upvote_ratio: data.upvote_ratio || 0,
                ups: data.ups || 0,
                permalink: data.permalink || ''
            };
        })
        .filter(function(post) {
            return post.title;
        });

    return posts;
}

// Node.js环境执行
if (typeof require !== 'undefined') {
    var fs = require('fs');
    
    try {
        // 读取Reddit数据文件
        var redditData = fs.readFileSync('reddit_data.json', 'utf8');
        
        // 提取资讯列表
        var result = handler(redditData);
        
        // 保存结果到文件
        fs.writeFileSync('reddit_top_news.json', JSON.stringify(result, null, 2), 'utf8');
        
        console.log('成功提取 ' + result.length + ' 条资讯');
        console.log('结果已保存到 reddit_top_news.json');
    } catch (error) {
        console.error('处理失败:', error.message);
        process.exit(1);
    }
}
