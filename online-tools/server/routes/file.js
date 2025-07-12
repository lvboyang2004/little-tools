const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const fileController = require('../controllers/fileController');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/temp');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // 生成一个唯一的文件名
        const uniqueSuffix = Date.now() + '-' + uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// 配置上传中间件
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    }
});

const router = express.Router();

// 文件转换请求
router.post('/convert', upload.single('file'), fileController.convertFile);

// 获取转换状态
router.get('/status/:taskId', fileController.getConversionStatus);

// 下载转换后的文件
router.get('/download/:fileId', fileController.downloadConvertedFile);

module.exports = router; 