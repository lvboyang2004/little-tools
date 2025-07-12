const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');

// 导入路由
const imageRoutes = require('./routes/image');
const fileRoutes = require('./routes/file');

// 创建Express应用
const app = express();

// 配置中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保上传目录存在
const isVercel = process.env.VERCEL === '1';
const uploadsDir = isVercel 
    ? '/tmp/uploads' 
    : path.join(__dirname, 'uploads');
const tempDir = path.join(uploadsDir, 'temp');
const processedDir = path.join(uploadsDir, 'processed');

// 在非Vercel环境或请求处理时创建目录
if (!isVercel) {
    fs.ensureDirSync(uploadsDir);
    fs.ensureDirSync(tempDir);
    fs.ensureDirSync(processedDir);
}

// 确保目录创建函数 - 用于Vercel环境
const ensureDirs = () => {
    fs.ensureDirSync(uploadsDir);
    fs.ensureDirSync(tempDir);
    fs.ensureDirSync(processedDir);
    return { uploadsDir, tempDir, processedDir };
};

// 将目录信息传递给请求
app.use((req, res, next) => {
    req.dirs = isVercel ? ensureDirs() : { uploadsDir, tempDir, processedDir };
    next();
});

// 提供静态文件访问
app.use('/uploads', express.static(uploadsDir));

// 配置API路由
app.use('/api/image', imageRoutes);
app.use('/api/file', fileRoutes);

// 提供前端静态文件访问
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/dist');
    if (fs.existsSync(clientBuildPath)) {
        app.use(express.static(clientBuildPath));
        
        app.get('*', (req, res) => {
            if (!req.path.startsWith('/api')) {
                res.sendFile(path.join(clientBuildPath, 'index.html'));
            } else {
                next();
            }
        });
    }
}

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 为Vercel环境导出，或者在标准环境中启动服务器
if (isVercel) {
    // 导出为Vercel函数
    module.exports = app;
} else {
    // 启动服务器
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
} 