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
const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(uploadsDir, 'temp');
const processedDir = path.join(uploadsDir, 'processed');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(tempDir);
fs.ensureDirSync(processedDir);

// 提供静态文件访问
app.use('/uploads', express.static(uploadsDir));

// 配置API路由
app.use('/api/image', imageRoutes);
app.use('/api/file', fileRoutes);

// 提供前端静态文件访问
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientBuildPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
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

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 