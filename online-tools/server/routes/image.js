const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

// 配置存储引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/temp'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: fileFilter
});

// 图片压缩路由
router.post('/compress', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有收到上传的图片'
            });
        }

        const { quality = 80, width, height } = req.body;
        const outputPath = path.join(__dirname, '../uploads/processed', `compressed_${req.file.filename}`);
        
        let sharpInstance = sharp(req.file.path);
        
        // 调整尺寸（如果提供了宽度和高度）
        if (width || height) {
            sharpInstance = sharpInstance.resize({
                width: width ? parseInt(width) : null,
                height: height ? parseInt(height) : null,
                withoutEnlargement: true
            });
        }
        
        // 根据文件扩展名选择输出格式和压缩选项
        const ext = path.extname(req.file.originalname).toLowerCase();
        
        switch (ext) {
            case '.jpg':
            case '.jpeg':
                await sharpInstance.jpeg({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            case '.png':
                await sharpInstance.png({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            case '.webp':
                await sharpInstance.webp({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            default:
                await sharpInstance.jpeg({ quality: parseInt(quality) }).toFile(outputPath);
        }
        
        // 获取文件大小
        const stats = await fs.stat(outputPath);
        
        res.json({
            success: true,
            message: '图片压缩成功',
            originalSize: req.file.size,
            compressedSize: stats.size,
            savingPercent: ((req.file.size - stats.size) / req.file.size * 100).toFixed(2),
            url: `/uploads/processed/compressed_${req.file.filename}`
        });
        
    } catch (error) {
        console.error('图片压缩失败:', error);
        res.status(500).json({
            success: false,
            message: '图片压缩失败',
            error: error.message
        });
    }
});

// 图片水印路由
// 配置水印图片上传
const watermarkUpload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: fileFilter
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'watermarkImage', maxCount: 1 }
]);

router.post('/watermark', watermarkUpload, async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({
                success: false,
                message: '没有收到上传的图片'
            });
        }

        const mainImage = req.files.image[0];
        const watermarkImage = req.files.watermarkImage ? req.files.watermarkImage[0] : null;
        
        const { 
            type, 
            text, 
            position = 'bottomRight', 
            opacity = 50,
            fontFamily = 'Arial',
            fontSize = 24,
            color = '#ffffff',
            imageSize = 30
        } = req.body;
        
        const outputPath = path.join(__dirname, '../uploads/processed', `watermark_${mainImage.filename}`);
        
        // 获取原始图片信息
        const imageMetadata = await sharp(mainImage.path).metadata();
        const { width: imgWidth, height: imgHeight } = imageMetadata;
        
        // 创建一个Sharp实例
        let sharpInstance = sharp(mainImage.path);
        
        // 处理水印
        if (type === 'text' && text) {
            // 文字水印处理
            let gravity;
            let textX, textY;
            
            switch (position) {
                case 'topLeft':
                    gravity = 'northwest';
                    break;
                case 'center':
                    gravity = 'center';
                    break;
                case 'bottomRight':
                    gravity = 'southeast';
                    break;
                case 'custom':
                    // 自定义位置在SVG中处理
                    const posX = parseFloat(req.body.posX) || 50;
                    const posY = parseFloat(req.body.posY) || 50;
                    textX = Math.round((posX / 100) * imgWidth);
                    textY = Math.round((posY / 100) * imgHeight);
                    gravity = null;
                    break;
                default:
                    gravity = 'southeast'; // 默认右下角
            }
            
            // 解析颜色
            const rgbColor = color.startsWith('#') 
                ? hexToRgb(color) 
                : { r: 255, g: 255, b: 255 }; // 默认白色
            
            // 创建SVG水印
            const opacityValue = parseFloat(opacity) / 100;
            const watermarkSvg = `
                <svg width="${imgWidth}" height="${imgHeight}">
                    <style>
                        .text {
                            fill: rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacityValue});
                            font-family: ${fontFamily}, Arial, sans-serif;
                            font-size: ${fontSize}px;
                            font-weight: bold;
                            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
                        }
                    </style>
                    <text 
                        x="${gravity ? '50%' : textX}" 
                        y="${gravity ? '50%' : textY}" 
                        text-anchor="${gravity ? 'middle' : 'start'}" 
                        dominant-baseline="${gravity ? 'middle' : 'hanging'}"
                        class="text">${text}</text>
                </svg>
            `;
            
            // 合成水印到图片
            await sharpInstance
                .composite([{
                    input: Buffer.from(watermarkSvg),
                    gravity: gravity || undefined,
                    blend: 'over'
                }])
                .toFormat(path.extname(mainImage.originalname).substring(1) || 'jpeg')
                .toFile(outputPath);
                
        } else if (type === 'image' && watermarkImage) {
            // 图片水印处理
            let gravity;
            
            // 水印位置
            switch (position) {
                case 'topLeft':
                    gravity = 'northwest';
                    break;
                case 'center':
                    gravity = 'center';
                    break;
                case 'bottomRight':
                    gravity = 'southeast';
                    break;
                default:
                    gravity = 'southeast'; // 默认右下角
            }
            
            // 处理水印图片大小
            const size = parseInt(imageSize) / 100;
            const watermarkWidth = Math.round(imgWidth * size);
            
            // 调整水印图片大小并应用透明度
            const resizedWatermarkPath = path.join(__dirname, '../uploads/temp', `resized_${watermarkImage.filename}`);
            await sharp(watermarkImage.path)
                .resize({ width: watermarkWidth })
                .ensureAlpha(parseFloat(opacity) / 100)
                .toFile(resizedWatermarkPath);
                
            // 合成水印到原图
            await sharpInstance
                .composite([{
                    input: resizedWatermarkPath,
                    gravity: gravity,
                    blend: 'over'
                }])
                .toFormat(path.extname(mainImage.originalname).substring(1) || 'jpeg')
                .toFile(outputPath);
                
            // 清理临时文件
            await fs.remove(resizedWatermarkPath);
            
        } else {
            // 如果没有合适的水印类型，直接返回原图
            await fs.copyFile(mainImage.path, outputPath);
        }
        
        res.json({
            success: true,
            message: '图片水印添加成功',
            url: `/uploads/processed/watermark_${mainImage.filename}`
        });
        
    } catch (error) {
        console.error('图片水印添加失败:', error);
        res.status(500).json({
            success: false,
            message: '图片水印添加失败',
            error: error.message
        });
    }
});

// 辅助函数：16进制颜色转RGB
function hexToRgb(hex) {
    // 移除#号
    hex = hex.replace(/^#/, '');
    
    // 处理3位颜色格式
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // 解析为RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

// 图片裁剪路由
router.post('/crop', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有收到上传的图片'
            });
        }

        // 获取裁剪参数
        const isRound = req.body.round === 'true';
        const outputPath = path.join(__dirname, '../uploads/processed', `cropped_${req.file.filename}`);
        
        // 处理图片
        try {
            if (isRound) {
                // 圆形裁剪处理
                const metadata = await sharp(req.file.path).metadata();
                const size = Math.min(metadata.width, metadata.height);
                
                // 创建圆形蒙版
                const circleSvg = Buffer.from(
                    `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`
                );
                
                // 应用圆形蒙版
                await sharp(req.file.path)
                    .resize(size, size, { 
                        fit: 'cover', 
                        position: 'center' 
                    })
                    .composite([{
                        input: circleSvg,
                        blend: 'dest-in'
                    }])
                    .png() // 圆形裁剪最好使用PNG格式以保留透明度
                    .toFile(outputPath);
            } else {
                // 常规裁剪，直接保存前端裁剪后的图片
                await fs.copy(req.file.path, outputPath);
            }
            
            res.json({
                success: true,
                message: '图片裁剪成功',
                url: `/uploads/processed/cropped_${req.file.filename}`
            });
        } catch (error) {
            console.error('图片处理失败:', error);
            res.status(500).json({
                success: false,
                message: '图片处理失败',
                error: error.message
            });
        }
    } catch (error) {
        console.error('图片裁剪失败:', error);
        res.status(500).json({
            success: false,
            message: '图片裁剪失败',
            error: error.message
        });
    }
});

// 图片格式转换路由
router.post('/convert', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有收到上传的图片'
            });
        }

        const { format, quality = 80 } = req.body;
        
        if (!format || !['jpeg', 'png', 'webp', 'gif'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: '不支持的格式，请选择 jpeg, png, webp 或 gif'
            });
        }
        
        const outputFilename = `converted_${path.parse(req.file.filename).name}.${format}`;
        const outputPath = path.join(__dirname, '../uploads/processed', outputFilename);
        
        let sharpInstance = sharp(req.file.path);
        
        switch (format) {
            case 'jpeg':
                await sharpInstance.jpeg({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            case 'png':
                await sharpInstance.png({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            case 'webp':
                await sharpInstance.webp({ quality: parseInt(quality) }).toFile(outputPath);
                break;
            case 'gif':
                await sharpInstance.gif().toFile(outputPath);
                break;
        }
        
        res.json({
            success: true,
            message: '图片格式转换成功',
            url: `/uploads/processed/${outputFilename}`
        });
        
    } catch (error) {
        console.error('图片格式转换失败:', error);
        res.status(500).json({
            success: false,
            message: '图片格式转换失败',
            error: error.message
        });
    }
});

module.exports = router; 