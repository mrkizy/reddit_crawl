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
        // 检查是否是HTML响应（通常以<开头）
        if (param1.trim().charAt(0) === '<') {
            console.error('错误: 收到HTML响应而非JSON，可能是API请求失败');
            console.error('响应前100个字符:', param1.substring(0, 100));
            return [];
        }
        
        try {
            jsonData = JSON.parse(param1);
        } catch (e) {
            console.error('JSON解析失败:', e.message);
            console.error('响应前200个字符:', param1.substring(0, 200));
            return [];
        }
    } else {
        jsonData = param1;
    }
    
    // 检查数据格式
    if (!jsonData || !jsonData.data || !jsonData.data.children) {
        console.error('无效的数据格式');
        console.error('数据结构:', Object.keys(jsonData || {}));
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
    var https = require('https');
    var http = require('http');
    
    // 获取Reddit数据的函数
    function fetchRedditData(callback) {
        var options = {
            hostname: 'www.reddit.com',
            path: '/r/all/hot.json?limit=25',
            method: 'GET',
            headers: {
                'User-Agent': 'RedditExtractor/1.0 (Node.js)',
                'Accept': 'application/json'
            }
        };
        
        var req = https.request(options, function(res) {
            var data = '';
            
            console.log('状态码:', res.statusCode);
            console.log('响应头:', res.headers);
            
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
                if (res.statusCode !== 200) {
                    console.error('HTTP错误:', res.statusCode);
                    console.error('响应内容:', data.substring(0, 500));
                    callback(new Error('HTTP ' + res.statusCode), null);
                    return;
                }
                callback(null, data);
            });
        });
        
        req.on('error', function(e) {
            console.error('请求错误:', e.message);
            callback(e, null);
        });
        
        req.end();
    }
    
    // 主执行逻辑
    function main() {
        // 先尝试从文件读取（如果存在）
        if (fs.existsSync('reddit_data.json')) {
            console.log('从文件读取 reddit_data.json');
            try {
                var fileData = fs.readFileSync('reddit_data.json', 'utf8');
                var result = handler(fileData);
                
                if (result.length > 0) {
                    fs.writeFileSync('reddit_top_news.json', JSON.stringify(result, null, 2), 'utf8');
                    console.log('成功提取 ' + result.length + ' 条资讯');
                    console.log('结果已保存到 reddit_top_news.json');
                    return;
                } else {
                    console.log('文件数据无效，尝试从API获取');
                }
            } catch (e) {
                console.error('读取文件失败:', e.message);
            }
        }
        
        // 从API获取数据
        console.log('从Reddit API获取数据...');
        fetchRedditData(function(error, jsonString) {
            if (error) {
                console.error('获取数据失败:', error.message);
                process.exit(1);
                return;
            }
            
            // 保存原始数据（用于调试）
            fs.writeFileSync('reddit_data.json', jsonString, 'utf8');
            console.log('原始数据已保存到 reddit_data.json');
            
            // 提取资讯列表
            var result = handler(jsonString);
            
            if (result.length === 0) {
                console.error('未能提取到任何资讯，请检查数据格式');
                process.exit(1);
                return;
            }
            
            // 保存结果到文件
            fs.writeFileSync('reddit_top_news.json', JSON.stringify(result, null, 2), 'utf8');
            
            console.log('成功提取 ' + result.length + ' 条资讯');
            console.log('结果已保存到 reddit_top_news.json');
        });
    }
    
    // 执行主函数
    main();
}
