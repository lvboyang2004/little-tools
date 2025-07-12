<template>
  <div class="tool-page bilibili-style">
    <div class="tool-header">
      <h1>图片水印</h1>
      <p>为您的图片添加文字或图片水印，保护您的知识产权</p>
    </div>

    <div class="tool-container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <el-upload
          class="upload-area"
          drag
          :action="null"
          :http-request="handleImageUpload"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :auto-upload="false"
          :file-list="fileList"
          :on-remove="handleRemove"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">拖拽图片到此区域，或 <em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">
            支持JPG、PNG、WebP格式，单个文件不超过10MB
          </div>
        </el-upload>
      </div>

      <!-- 图片预览区 -->
      <div class="preview-section" v-if="imageUrl">
        <h2>水印预览</h2>
        <div class="preview-container">
          <div class="preview-image" ref="previewContainer">
            <img :src="imageUrl" ref="previewImage" alt="图片预览" />
            <div class="watermark-preview" :style="watermarkPreviewStyle" v-if="watermarkSettings.type === 'text'">
              {{ watermarkSettings.text }}
            </div>
            <div class="watermark-preview" :style="watermarkImageStyle" v-else-if="watermarkSettings.type === 'image' && watermarkImageUrl">
              <img :src="watermarkImageUrl" alt="水印图片" />
            </div>
          </div>
        </div>
      </div>

      <!-- 水印设置区 -->
      <div class="settings-section" v-if="imageUrl">
        <h2>水印设置</h2>
        
        <!-- 水印类型选择 -->
        <div class="setting-group">
          <label>水印类型</label>
          <el-radio-group v-model="watermarkSettings.type">
            <el-radio label="text">文字水印</el-radio>
            <el-radio label="image">图片水印</el-radio>
          </el-radio-group>
        </div>

        <!-- 水印位置选择 -->
        <div class="setting-group">
          <label>水印位置</label>
          <el-radio-group v-model="watermarkSettings.position">
            <el-radio label="topLeft">左上角</el-radio>
            <el-radio label="center">中心</el-radio>
            <el-radio label="bottomRight">右下角</el-radio>
            <el-radio label="custom">自定义位置</el-radio>
          </el-radio-group>
        </div>

        <!-- 文字水印设置 -->
        <div v-if="watermarkSettings.type === 'text'">
          <div class="setting-group">
            <label>水印文字</label>
            <el-input v-model="watermarkSettings.text" placeholder="请输入水印文字"></el-input>
          </div>
          
          <div class="setting-group">
            <label>字体选择</label>
            <el-select v-model="watermarkSettings.fontFamily">
              <el-option label="默认" value="Arial"></el-option>
              <el-option label="黑体" value="SimHei"></el-option>
              <el-option label="楷体" value="KaiTi"></el-option>
              <el-option label="宋体" value="SimSun"></el-option>
            </el-select>
          </div>
          
          <div class="setting-group">
            <label>字体大小</label>
            <el-slider v-model="watermarkSettings.fontSize" :min="10" :max="72" show-input></el-slider>
          </div>
          
          <div class="setting-group">
            <label>文字颜色</label>
            <el-color-picker v-model="watermarkSettings.color"></el-color-picker>
          </div>
        </div>

        <!-- 图片水印设置 -->
        <div v-if="watermarkSettings.type === 'image'">
          <div class="setting-group">
            <label>上传水印图片</label>
            <el-upload
              class="watermark-image-upload"
              :action="null"
              :http-request="handleWatermarkImageUpload"
              :before-upload="beforeWatermarkImageUpload"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button type="primary">选择水印图片</el-button>
            </el-upload>
            
            <div class="watermark-image-preview" v-if="watermarkImageUrl">
              <img :src="watermarkImageUrl" alt="水印图片预览" />
            </div>
          </div>
          
          <div class="setting-group">
            <label>水印图片大小</label>
            <el-slider v-model="watermarkSettings.imageSize" :min="10" :max="100" show-input></el-slider>
          </div>
        </div>

        <!-- 共同设置 -->
        <div class="setting-group">
          <label>透明度</label>
          <el-slider v-model="watermarkSettings.opacity" :min="0" :max="100" :format-tooltip="formatOpacity" show-input></el-slider>
        </div>

        <!-- 自定义位置 -->
        <div class="setting-group" v-if="watermarkSettings.position === 'custom'">
          <label>水平位置</label>
          <el-slider v-model="watermarkSettings.posX" :min="0" :max="100" show-input></el-slider>
          
          <label>垂直位置</label>
          <el-slider v-model="watermarkSettings.posY" :min="0" :max="100" show-input></el-slider>
        </div>
        
        <!-- 水印操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="applyWatermark" :loading="isProcessing" :disabled="!imageUrl">应用水印</el-button>
          <el-button @click="resetSettings">重置设置</el-button>
        </div>
      </div>

      <!-- 结果区域 -->
      <div class="result-section" v-if="resultUrl">
        <h2>处理结果</h2>
        <div class="result-container">
          <div class="result-image">
            <img :src="resultUrl" alt="处理结果" />
          </div>
          <div class="result-actions">
            <el-button type="success" @click="downloadResult">下载图片</el-button>
            <el-button @click="resetProcess">重新处理</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageWatermark',
  data() {
    return {
      fileList: [],
      imageUrl: null,
      watermarkImageUrl: null,
      watermarkFile: null, // 添加水印文件存储
      watermarkSettings: {
        type: 'text',
        position: 'bottomRight',
        text: '© 版权所有',
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        opacity: 50,
        imageSize: 30,
        posX: 50,
        posY: 50
      },
      resultUrl: null,
      isProcessing: false
    }
  },
  computed: {
    watermarkPreviewStyle() {
      const positionStyle = this.getPositionStyle();
      return {
        ...positionStyle,
        fontFamily: this.watermarkSettings.fontFamily,
        fontSize: `${this.watermarkSettings.fontSize}px`,
        color: this.watermarkSettings.color,
        opacity: this.watermarkSettings.opacity / 100
      }
    },
    watermarkImageStyle() {
      const positionStyle = this.getPositionStyle();
      return {
        ...positionStyle,
        width: `${this.watermarkSettings.imageSize}%`,
        opacity: this.watermarkSettings.opacity / 100
      }
    }
  },
  methods: {
    formatOpacity(val) {
      return val + '%';
    },
    getPositionStyle() {
      let style = {};
      
      switch (this.watermarkSettings.position) {
        case 'topLeft':
          style = { top: '10px', left: '10px' };
          break;
        case 'center':
          style = { 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)' 
          };
          break;
        case 'bottomRight':
          style = { bottom: '10px', right: '10px' };
          break;
        case 'custom':
          style = { 
            top: `${this.watermarkSettings.posY}%`, 
            left: `${this.watermarkSettings.posX}%`,
            transform: 'translate(-50%, -50%)' 
          };
          break;
      }
      
      return style;
    },
    handleFileChange(file) {
      if (file && file.raw) {
        this.fileList = [file];
        this.imageUrl = URL.createObjectURL(file.raw);
        this.resultUrl = null;
      }
    },
    handleRemove() {
      this.fileList = [];
      this.imageUrl = null;
      this.resultUrl = null;
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/');
      const isLt10M = file.size / 1024 / 1024 < 10;
      
      if (!isImage) {
        this.$message.error('只能上传图片文件!');
        return false;
      }
      if (!isLt10M) {
        this.$message.error('图片大小不能超过10MB!');
        return false;
      }
      
      return true;
    },
    handleImageUpload({ file }) {
      // 这里只处理预览，实际上传在applyWatermark中进行
      this.imageUrl = URL.createObjectURL(file);
      this.resultUrl = null;
    },
    beforeWatermarkImageUpload(file) {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;
      
      if (!isImage) {
        this.$message.error('只能上传图片文件!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('水印图片大小不能超过2MB!');
        return false;
      }
      
      return true;
    },
    handleWatermarkImageUpload({ file }) {
      this.watermarkImageUrl = URL.createObjectURL(file);
      this.watermarkFile = file; // 保存水印文件对象
    },
    resetSettings() {
      this.watermarkSettings = {
        type: 'text',
        position: 'bottomRight',
        text: '© 版权所有',
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        opacity: 50,
        imageSize: 30,
        posX: 50,
        posY: 50
      };
    },
    applyWatermark() {
      if (!this.imageUrl || this.fileList.length === 0) {
        this.$message.warning('请先上传图片');
        return;
      }
      
      if (this.watermarkSettings.type === 'text' && !this.watermarkSettings.text.trim()) {
        this.$message.warning('请输入水印文字');
        return;
      }
      
      if (this.watermarkSettings.type === 'image' && !this.watermarkImageUrl) {
        this.$message.warning('请上传水印图片');
        return;
      }
      
      this.isProcessing = true;
      
      const formData = new FormData();
      formData.append('image', this.fileList[0].raw);
      
      // 添加水印设置
      Object.keys(this.watermarkSettings).forEach(key => {
        formData.append(key, this.watermarkSettings[key]);
      });
      
      // 如果是图片水印，添加水印图片
      if (this.watermarkSettings.type === 'image' && this.watermarkFile) {
        formData.append('watermarkImage', this.watermarkFile);
      }
      
      // 发送请求
      // 使用window.axios (CDN全局导入)
      window.axios.post('/api/image/watermark', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(response => {
        if (response.data.success) {
          this.resultUrl = response.data.url;
          this.$message.success('水印添加成功!');
        } else {
          this.$message.error('水印添加失败: ' + response.data.message);
        }
      }).catch(error => {
        console.error('添加水印失败:', error);
        this.$message.error('添加水印失败: ' + (error.message || '未知错误'));
      }).finally(() => {
        this.isProcessing = false;
      });
    },
    downloadResult() {
      if (!this.resultUrl) {
        this.$message.warning('没有可下载的结果');
        return;
      }
      
      const link = document.createElement('a');
      link.href = this.resultUrl;
      link.download = 'watermarked_image.jpg';
      link.click();
    },
    resetProcess() {
      this.resultUrl = null;
    }
  }
}
</script>

<style scoped>
.tool-page {
  padding-bottom: 40px;
}

.bilibili-style {
  --bili-blue: #00aeec;
  --bili-pink: #fb7299;
  --bili-gray: #f6f7f8;
  --bili-text: #212121;
}

.tool-header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 20px;
}

.tool-header h1 {
  font-size: 32px;
  color: var(--bili-pink);
  margin-bottom: 16px;
}

.tool-header p {
  font-size: 16px;
  color: #606266;
  max-width: 600px;
  margin: 0 auto;
}

.tool-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 30px;
  margin-bottom: 40px;
  border: 1px solid #eee;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-area {
  width: 100%;
}

.preview-section {
  margin-bottom: 30px;
}

.preview-section h2, .settings-section h2, .result-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--bili-blue);
  position: relative;
  padding-left: 12px;
}

.preview-section h2::before, .settings-section h2::before, .result-section h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background-color: var(--bili-pink);
  border-radius: 2px;
}

.preview-container {
  margin-bottom: 20px;
}

.preview-image {
  max-width: 100%;
  position: relative;
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.preview-image img {
  max-width: 100%;
  display: block;
}

.watermark-preview {
  position: absolute;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  user-select: none;
  pointer-events: none;
  max-width: 90%;
  max-height: 90%;
  overflow: hidden;
}

.watermark-preview img {
  max-width: 100%;
}

.settings-section {
  margin-bottom: 30px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--bili-text);
}

.watermark-image-upload {
  margin-bottom: 10px;
}

.watermark-image-preview {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-top: 10px;
}

.watermark-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.action-buttons .el-button--primary {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

.result-section {
  margin-bottom: 30px;
}

.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.result-image {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 4px;
}

.result-image img {
  max-width: 100%;
  display: block;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.result-actions .el-button--success {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

/* Element Plus 组件样式覆盖 */
:deep(.el-upload-dragger) {
  border: 2px dashed var(--bili-blue);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--bili-pink);
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: var(--bili-blue);
  background: var(--bili-blue);
}

:deep(.el-slider__bar) {
  background-color: var(--bili-blue);
}

:deep(.el-slider__button) {
  border-color: var(--bili-blue);
}

:deep(.el-button--primary) {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

:deep(.el-button--success) {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}
</style> 