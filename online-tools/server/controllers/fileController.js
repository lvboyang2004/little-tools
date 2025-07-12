const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fileService = require('../services/fileService');

// 存储转换任务状态
const conversionTasks = new Map();

/**
 * 处理文件转换请求
 */
exports.convertFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有收到上传的文件'
            });
        }

        const { targetFormat } = req.body;
        
        if (!targetFormat) {
            return res.status(400).json({
                success: false,
                message: '请指定目标格式'
            });
        }
        
        // 生成唯一任务ID
        const taskId = uuidv4();
        
        // 初始化任务状态
        conversionTasks.set(taskId, {
            status: 'processing',
            progress: 0,
            message: '开始转换...',
            inputFile: req.file.path,
            originalName: req.file.originalname,
            targetFormat,
            outputFile: null
        });
        
        // 异步开始转换流程
        fileService.convertFile(req.file.path, targetFormat, {
            onProgress: (progress, message) => {
                const task = conversionTasks.get(taskId);
                if (task) {
                    task.progress = progress;
                    task.message = message;
                }
            },
            onComplete: (outputFile) => {
                const task = conversionTasks.get(taskId);
                if (task) {
                    task.status = 'completed';
                    task.progress = 100;
                    task.message = '转换完成';
                    task.outputFile = outputFile;
                    // 生成下载链接
                    task.downloadUrl = `/api/file/download/${path.basename(outputFile)}`;
                }
            },
            onError: (error) => {
                const task = conversionTasks.get(taskId);
                if (task) {
                    task.status = 'failed';
                    task.message = `转换失败: ${error.message}`;
                    task.error = error.message;
                }
            }
        });
        
        // 立即返回任务ID，让前端可以轮询状态
        res.json({
            success: true,
            message: '文件已接收，开始转换',
            taskId
        });
        
    } catch (error) {
        console.error('文件转换请求处理失败:', error);
        res.status(500).json({
            success: false,
            message: '文件转换失败',
            error: error.message
        });
    }
};

/**
 * 获取文件转换状态
 */
exports.getConversionStatus = (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: '任务ID不能为空'
            });
        }
        
        const task = conversionTasks.get(taskId);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的转换任务'
            });
        }
        
        // 返回当前状态
        res.json({
            success: true,
            status: task.status,
            progress: task.progress,
            message: task.message,
            downloadUrl: task.downloadUrl,
            error: task.error
        });
        
    } catch (error) {
        console.error('获取转换状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取转换状态失败',
            error: error.message
        });
    }
};

/**
 * 下载转换后的文件
 */
exports.downloadConvertedFile = (req, res) => {
    try {
        const { fileId } = req.params;
        
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: '文件ID不能为空'
            });
        }
        
        const filePath = path.join(__dirname, '../uploads/processed', fileId);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: '文件不存在或已被删除'
            });
        }
        
        // 获取原始文件名（如果可能）
        let originalName = fileId;
        
        // 查找任务获取原始文件名
        for (const [_, task] of conversionTasks.entries()) {
            if (task.outputFile === filePath || task.outputFile?.endsWith(fileId)) {
                const ext = path.extname(fileId);
                originalName = `${path.parse(task.originalName).name}${ext}`;
                break;
            }
        }
        
        // 发送文件
        res.download(filePath, originalName);
        
    } catch (error) {
        console.error('文件下载失败:', error);
        res.status(500).json({
            success: false,
            message: '文件下载失败',
            error: error.message
        });
    }
}; 