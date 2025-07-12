<template>
  <div class="tool-page bilibili-style">
    <div class="tool-header">
      <h1>图片压缩</h1>
      <p>压缩您的图片，减小文件大小，同时保持良好的图片质量</p>
    </div>

    <div class="tool-container">
      <div class="upload-section">
        <el-upload
          class="upload-area"
          drag
          :action="null"
          :http-request="customUpload"
          multiple
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :file-list="fileList"
          :auto-upload="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">拖拽图片到此处，或 <em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">
            支持JPG、PNG、WebP格式，单个文件不超过10MB
          </div>
        </el-upload>
      </div>

      <div class="settings-section">
        <h2>压缩设置</h2>
        <el-form label-position="top" :model="compressionSettings">
          <el-form-item label="压缩质量">
            <el-slider
              v-model="compressionSettings.quality"
              :min="0"
              :max="100"
              :format-tooltip="formatQuality"
            ></el-slider>
          </el-form-item>
          <el-form-item label="压缩方式">
            <el-radio-group v-model="compressionSettings.mode">
              <el-radio label="lossy">有损压缩 (更小体积)</el-radio>
              <el-radio label="lossless">无损压缩 (更好质量)</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="保持原始尺寸">
            <el-switch v-model="compressionSettings.keepOriginalSize"></el-switch>
          </el-form-item>
          <el-form-item v-if="!compressionSettings.keepOriginalSize" label="调整尺寸">
            <el-input-number
              v-model="compressionSettings.width"
              :min="1"
              :max="10000"
              label="宽度"
            ></el-input-number>
            <span class="dimension-separator">x</span>
            <el-input-number
              v-model="compressionSettings.height"
              :min="1"
              :max="10000"
              label="高度"
            ></el-input-number>
          </el-form-item>
        </el-form>
        <div class="action-buttons">
          <el-button type="primary" @click="startCompression" :disabled="fileList.length === 0">
            开始压缩
          </el-button>
          <el-button @click="resetSettings">重置设置</el-button>
        </div>
      </div>

      <div class="result-section" v-if="compressionResults.length > 0">
        <h2>压缩结果</h2>
        <el-table :data="compressionResults" style="width: 100%">
          <el-table-column label="原图预览">
            <template #default="scope">
              <div class="image-preview">
                <img :src="scope.row.originalUrl" alt="原图预览" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="压缩后预览">
            <template #default="scope">
              <div class="image-preview">
                <img :src="scope.row.compressedUrl" alt="压缩后预览" />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="fileName" label="文件名"></el-table-column>
          <el-table-column prop="originalSize" label="原始大小"></el-table-column>
          <el-table-column prop="compressedSize" label="压缩后大小"></el-table-column>
          <el-table-column prop="savingPercent" label="节省比例"></el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button type="primary" size="small" @click="downloadImage(scope.row)">
                下载
              </el-button>
              <el-button type="danger" size="small" @click="deleteResult(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="batch-actions">
          <el-button type="success" @click="downloadAll">下载全部</el-button>
          <el-button type="danger" @click="clearResults">清空结果</el-button>
        </div>
      </div>
    </div>

    <div class="tool-faq">
      <h2>常见问题</h2>
      <el-collapse>
        <el-collapse-item title="什么是图片压缩？" name="1">
          <p>
            图片压缩是一种减小图片文件大小的过程，同时尽量保持图片的视觉质量。这对于优化网页加载速度、节省存储空间和减少网络流量非常有用。
          </p>
        </el-collapse-item>
        <el-collapse-item title="有损压缩和无损压缩的区别是什么？" name="2">
          <p>
            有损压缩会永久删除一些图片数据，通常可以实现较高的压缩率，但可能会降低图片质量。无损压缩保留所有原始数据，图片质量不会下降，但压缩率通常较低。
          </p>
        </el-collapse-item>
        <el-collapse-item title="压缩会影响我的图片质量吗？" name="3">
          <p>
            这取决于您选择的压缩设置。高质量设置下的有损压缩通常很难与原图区分，而低质量设置可能会导致可见的质量下降。无损压缩不会影响图片质量。
          </p>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ImageCompression',
  data() {
    return {
      fileList: [],
      compressionSettings: {
        quality: 80,
        mode: 'lossy',
        keepOriginalSize: true,
        width: 800,
        height: 600
      },
      compressionResults: [],
      isProcessing: false
    }
  },
  methods: {
    formatQuality(val) {
      return val + '%'
    },
    handleRemove(file, fileList) {
      this.fileList = fileList
    },
    handleFileChange(file, fileList) {
      this.fileList = fileList
    },
    beforeUpload(file) {
      const isImage = file.type.indexOf('image/') !== -1
      const isLt10M = file.size / 1024 / 1024 < 10
      
      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt10M) {
        this.$message.error('图片大小不能超过 10MB!')
        return false
      }
      
      return true
    },
    customUpload({ file, onSuccess, onError }) {
      // 创建FormData对象
      const formData = new FormData()
      formData.append('image', file)
      formData.append('quality', this.compressionSettings.quality)
      
      // 添加尺寸设置（如果需要调整大小）
      if (!this.compressionSettings.keepOriginalSize) {
        formData.append('width', this.compressionSettings.width)
        formData.append('height', this.compressionSettings.height)
      }
      
      // 发送请求
      axios.post('/api/image/compress', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(response => {
        if (response.data.success) {
          // 处理成功响应
          const result = {
            fileName: file.name,
            originalUrl: URL.createObjectURL(file),
            compressedUrl: response.data.url,
            originalSize: this.formatFileSize(file.size),
            compressedSize: this.formatFileSize(response.data.compressedSize),
            savingPercent: response.data.savingPercent + '%',
            downloadUrl: response.data.url
          }
          
          this.compressionResults.push(result)
          onSuccess(response.data)
          this.$message.success('压缩成功!')
        } else {
          onError(new Error('压缩失败'))
          this.$message.error('压缩失败: ' + response.data.message)
        }
      }).catch(error => {
        onError(error)
        this.$message.error('压缩失败: ' + error.message)
      }).finally(() => {
        this.isProcessing = false
      })
    },
    startCompression() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先上传图片')
        return
      }
      
      this.isProcessing = true
      this.$message.info('开始处理图片...')
      
      // 遍历所有待压缩的文件
      const promises = this.fileList.map(file => {
        return new Promise((resolve, reject) => {
          this.customUpload({
            file: file.raw,
            onSuccess: resolve,
            onError: reject
          })
        })
      })
      
      Promise.all(promises)
        .then(() => {
          this.$message.success('所有图片压缩完成!')
        })
        .catch(error => {
          console.error('压缩过程中出错:', error)
          this.$message.error('部分图片压缩失败')
        })
        .finally(() => {
          this.isProcessing = false
          this.fileList = [] // 清空上传列表
        })
    },
    resetSettings() {
      this.compressionSettings = {
        quality: 80,
        mode: 'lossy',
        keepOriginalSize: true,
        width: 800,
        height: 600
      }
    },
    downloadImage(result) {
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = 'compressed_' + result.fileName
      link.click()
    },
    deleteResult(index) {
      this.compressionResults.splice(index, 1)
    },
    downloadAll() {
      if (this.compressionResults.length === 0) {
        this.$message.warning('没有可下载的结果')
        return
      }
      
      this.compressionResults.forEach(result => {
        this.downloadImage(result)
      })
      
      this.$message.success('开始下载所有图片')
    },
    clearResults() {
      this.compressionResults = []
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

.settings-section {
  margin-bottom: 30px;
}

.settings-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--bili-blue);
  position: relative;
  padding-left: 12px;
}

.settings-section h2::before {
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

.dimension-separator {
  margin: 0 10px;
  font-size: 16px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.action-buttons .el-button--primary {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

.result-section {
  margin-bottom: 30px;
}

.result-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--bili-blue);
  position: relative;
  padding-left: 12px;
}

.result-section h2::before {
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

.image-preview {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.batch-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.batch-actions .el-button--success {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

.tool-faq {
  margin-bottom: 20px;
}

.tool-faq h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--bili-blue);
  text-align: center;
  position: relative;
  padding-bottom: 10px;
}

.tool-faq h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background-color: var(--bili-pink);
  border-radius: 2px;
}

/* B站风格的元素 */
:deep(.el-upload-dragger) {
  border: 2px dashed var(--bili-blue);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--bili-pink);
}

:deep(.el-slider__bar) {
  background-color: var(--bili-blue);
}

:deep(.el-slider__button) {
  border-color: var(--bili-blue);
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: var(--bili-blue);
  background: var(--bili-blue);
}

:deep(.el-switch.is-checked .el-switch__core) {
  border-color: var(--bili-blue);
  background-color: var(--bili-blue);
}

:deep(.el-collapse-item__header) {
  color: var(--bili-text);
  font-weight: 500;
}

:deep(.el-table th) {
  background-color: var(--bili-gray);
}

:deep(.el-button--primary) {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

:deep(.el-button--danger) {
  background-color: var(--bili-pink);
  border-color: var(--bili-pink);
}
</style> 