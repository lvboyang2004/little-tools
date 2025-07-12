<template>
  <div class="tool-page bilibili-style">
    <div class="tool-header">
      <h1>图片格式转换</h1>
      <p>轻松在JPG、PNG、WebP等格式间转换您的图片</p>
    </div>
    <div class="tool-container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeUpload"
          :on-remove="handleRemove"
          :file-list="fileList"
          multiple
          :limit="10"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">拖拽图片到此区域，或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              支持JPG、PNG、WebP、GIF格式，单个文件不超过10MB
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 已上传图片列表 -->
      <div class="uploaded-list" v-if="fileList.length > 0">
        <h2>已上传图片</h2>
        <div class="thumbnail-container">
          <div v-for="(file, index) in fileList" :key="index" class="thumbnail-item">
            <div class="thumbnail">
              <img :src="getFileUrl(file)" :alt="file.name" />
            </div>
            <div class="thumbnail-info">
              <p class="thumbnail-name">{{ getFileName(file.name) }}</p>
              <p class="thumbnail-size">{{ formatFileSize(file.size) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 转换设置 -->
      <div class="settings-section" v-if="fileList.length > 0">
        <h2>转换设置</h2>
        
        <!-- 格式选择 -->
        <div class="setting-group">
          <label>选择目标格式</label>
          <el-radio-group v-model="convertSettings.format">
            <el-radio label="jpeg">JPG</el-radio>
            <el-radio label="png">PNG</el-radio>
            <el-radio label="webp">WebP</el-radio>
            <el-radio label="gif">GIF</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 质量选择 (对GIF无效) -->
        <div class="setting-group" v-if="convertSettings.format !== 'gif'">
          <label>质量设置</label>
          <el-radio-group v-model="convertSettings.quality">
            <el-radio :label="30">低 (小文件)</el-radio>
            <el-radio :label="70">中 (平衡)</el-radio>
            <el-radio :label="90">高 (高质量)</el-radio>
          </el-radio-group>
          
          <!-- 质量滑块 -->
          <el-slider
            v-model="convertSettings.quality"
            :min="10"
            :max="100"
            :step="5"
            :format-tooltip="formatQuality"
            show-stops
            class="quality-slider"
          ></el-slider>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="startConversion" 
            :disabled="fileList.length === 0 || isProcessing"
            :loading="isProcessing"
          >
            开始转换
          </el-button>
          <el-button @click="resetAll">重置</el-button>
        </div>
      </div>

      <!-- 转换结果 -->
      <div class="result-section" v-if="conversionResults.length > 0">
        <h2>转换结果</h2>
        <el-table :data="conversionResults" style="width: 100%" border>
          <el-table-column label="原始文件">
            <template #default="scope">
              <div class="result-file-info">
                <div class="result-thumbnail">
                  <img :src="scope.row.originalUrl" :alt="scope.row.fileName" />
                </div>
                <div>
                  <p>{{ scope.row.fileName }}</p>
                  <p class="file-meta">{{ scope.row.originalSize }}</p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="转换结果">
            <template #default="scope">
              <div class="result-file-info">
                <div class="result-thumbnail">
                  <img :src="scope.row.convertedUrl" :alt="scope.row.fileName" />
                </div>
                <div>
                  <p>{{ getConvertedFileName(scope.row) }}</p>
                  <p class="file-meta">
                    {{ scope.row.convertedFormat.toUpperCase() }} | {{ scope.row.convertedSize }}
                  </p>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button type="primary" size="small" @click="downloadFile(scope.row)">
                下载
              </el-button>
              <el-button type="danger" size="small" @click="removeResult(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 批量下载 -->
        <div class="batch-actions" v-if="conversionResults.length > 1">
          <el-button type="success" @click="downloadAllFiles">下载全部</el-button>
          <el-button type="danger" @click="clearAllResults">清空结果</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageConversion',
  data() {
    return {
      fileList: [],
      convertSettings: {
        format: 'jpeg',
        quality: 70
      },
      conversionResults: [],
      isProcessing: false
    }
  },
  methods: {
    formatQuality(value) {
      return `${value}%`;
    },
    getFileUrl(file) {
      return file.url || (file.raw ? URL.createObjectURL(file.raw) : '');
    },
    getFileName(name) {
      if (!name) return '';
      return name.length > 15 ? name.substring(0, 12) + '...' : name;
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    getConvertedFileName(result) {
      const name = result.fileName;
      const format = result.convertedFormat;
      const ext = name.substring(name.lastIndexOf('.'));
      return name.replace(ext, '.' + format);
    },
    handleFileChange(file, fileList) {
      // 确保传入的是数组
      if (fileList) {
        this.fileList = fileList;
      } else if (file) {
        // 如果只传入了file，添加到列表中
        this.fileList.push(file);
      }
      console.log('文件列表已更新', this.fileList);
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
    handleUpload({ file }) {
      // 这个方法只是用来预览，不实际上传
      const fileUrl = URL.createObjectURL(file);
      console.log('文件已预览', file.name, fileUrl);
      return Promise.resolve();
    },
    handleRemove(file, fileList) {
      this.fileList = fileList;
    },
    async startConversion() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先上传图片');
        return;
      }
      
      this.isProcessing = true;
      const totalFiles = this.fileList.length;
      let processedCount = 0;
      
      for (const file of this.fileList) {
        try {
          const formData = new FormData();
          formData.append('image', file.raw);
          formData.append('format', this.convertSettings.format);
          formData.append('quality', this.convertSettings.quality);
          
          this.$message.info(`正在处理 ${file.name} (${processedCount + 1}/${totalFiles})...`);
          
          const response = await fetch('/api/image/convert', {
            method: 'POST',
            body: formData
          }).then(res => res.json());
          
          if (response.success) {
            this.conversionResults.push({
              fileName: file.name,
              originalSize: this.formatFileSize(file.size),
              originalUrl: URL.createObjectURL(file.raw),
              convertedUrl: response.url,
              convertedFormat: this.convertSettings.format,
              convertedSize: '处理中...',
              downloadUrl: response.url
            });
          } else {
            this.$message.error(`处理 ${file.name} 失败: ${response.message}`);
          }
        } catch (error) {
          console.error('转换出错:', error);
          this.$message.error(`处理 ${file.name} 失败: ${error.message || '未知错误'}`);
        }
        
        processedCount++;
      }
      
      if (processedCount > 0) {
        this.$message.success(`成功转换 ${processedCount} 个文件`);
      }
      
      this.isProcessing = false;
    },
    resetAll() {
      this.fileList = [];
      this.convertSettings = {
        format: 'jpeg',
        quality: 70
      };
    },
    downloadFile(file) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = this.getConvertedFileName(file);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    downloadAllFiles() {
      if (this.conversionResults.length === 0) {
        this.$message.warning('没有可下载的文件');
        return;
      }
      
      this.conversionResults.forEach(file => {
        setTimeout(() => {
          this.downloadFile(file);
        }, 100);
      });
      
      this.$message.success('正在下载全部文件...');
    },
    removeResult(index) {
      this.conversionResults.splice(index, 1);
    },
    clearAllResults() {
      this.conversionResults = [];
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

h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--bili-blue);
  position: relative;
  padding-left: 12px;
}

h2::before {
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

.uploaded-list {
  margin-bottom: 30px;
}

.thumbnail-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.thumbnail-item {
  width: 120px;
  margin-bottom: 15px;
}

.thumbnail {
  width: 100%;
  height: 120px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.thumbnail-info {
  margin-top: 5px;
  text-align: center;
}

.thumbnail-name {
  font-size: 12px;
  color: #333;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumbnail-size {
  font-size: 11px;
  color: #999;
  margin: 3px 0 0;
}

.settings-section {
  margin-bottom: 30px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.quality-slider {
  margin-top: 15px;
  padding: 0 10px;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.result-section {
  margin-bottom: 30px;
}

.result-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-thumbnail {
  width: 60px;
  height: 60px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.file-meta {
  font-size: 12px;
  color: #999;
  margin: 3px 0 0;
}

.batch-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--bili-blue);
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

:deep(.el-button--danger) {
  background-color: var(--bili-pink);
  border-color: var(--bili-pink);
}

:deep(.el-table th) {
  background-color: var(--bili-gray);
}
</style> 