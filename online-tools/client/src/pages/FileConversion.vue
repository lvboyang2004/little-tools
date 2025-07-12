<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>文件转换</h1>
      <p>支持常见文档格式之间的转换，简单高效</p>
    </div>

    <div class="tool-container">
      <div class="upload-section">
        <el-upload
          class="upload-area"
          drag
          :action="'/api/file/convert'"
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          :on-success="handleSuccess"
          :on-error="handleError"
          :file-list="fileList"
          :auto-upload="false"
          :on-change="handleFileChange"
          :http-request="customUpload"
          ref="upload"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              支持DOC、DOCX、PPT、PPTX、XLS、XLSX、PDF、TXT等常见格式，单个文件不超过20MB
            </div>
          </template>
        </el-upload>
      </div>

      <div class="settings-section">
        <h2>转换设置</h2>
        <el-form label-position="top" :model="conversionSettings">
          <el-form-item label="目标格式">
            <el-select v-model="conversionSettings.targetFormat" placeholder="请选择目标格式">
              <el-option-group label="文档格式">
                <el-option label="PDF文档" value="pdf"></el-option>
                <el-option label="Word文档(DOCX)" value="docx"></el-option>
                <el-option label="纯文本(TXT)" value="txt"></el-option>
              </el-option-group>
              <el-option-group label="演示格式">
                <el-option label="PowerPoint(PPTX)" value="pptx"></el-option>
                <el-option label="PDF演示" value="pdf_presentation"></el-option>
              </el-option-group>
              <el-option-group label="表格格式">
                <el-option label="Excel(XLSX)" value="xlsx"></el-option>
                <el-option label="CSV表格" value="csv"></el-option>
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-form>
        <div class="action-buttons">
          <el-button type="primary" @click="startConversion" :disabled="fileList.length === 0 || !conversionSettings.targetFormat">
            开始转换
          </el-button>
          <el-button @click="resetSettings">重置</el-button>
        </div>
      </div>

      <div v-if="convertingFile" class="progress-section">
        <h2>转换进度</h2>
        <el-progress :percentage="conversionProgress" :status="conversionStatus"></el-progress>
        <div class="status-text">{{ statusMessage }}</div>
      </div>

      <div class="result-section" v-if="conversionResults.length > 0">
        <h2>转换结果</h2>
        <el-table :data="conversionResults" style="width: 100%">
          <el-table-column prop="fileName" label="文件名"></el-table-column>
          <el-table-column prop="originalFormat" label="原始格式"></el-table-column>
          <el-table-column prop="targetFormat" label="目标格式"></el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'completed' ? 'success' : 'warning'">
                {{ scope.row.status === 'completed' ? '转换完成' : '转换中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button 
                type="text" 
                size="small" 
                @click="downloadFile(scope.row)"
                :disabled="scope.row.status !== 'completed'"
              >
                下载
              </el-button>
              <el-button type="text" size="small" @click="deleteResult(scope.$index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="batch-actions">
          <el-button type="success" @click="downloadAll" :disabled="!hasCompletedResults">下载全部</el-button>
          <el-button type="danger" @click="clearResults">清空结果</el-button>
        </div>
      </div>
    </div>

    <div class="tool-faq">
      <h2>常见问题</h2>
      <el-collapse>
        <el-collapse-item title="支持哪些文件格式转换？" name="1">
          <p>
            目前支持的文档格式有：DOC、DOCX、PPT、PPTX、XLS、XLSX、PDF、TXT等常见格式之间的互相转换。
            我们持续更新支持的格式，如有特殊需求，请通过反馈渠道告诉我们。
          </p>
        </el-collapse-item>
        <el-collapse-item title="文件转换后会影响质量吗？" name="2">
          <p>
            不同格式之间的转换可能会导致一些格式细节的丢失，特别是复杂的排版和特殊效果。
            我们使用专业的转换引擎，尽可能保留原始文件的布局和格式，但无法保证100%一致。
          </p>
        </el-collapse-item>
        <el-collapse-item title="文件转换需要多长时间？" name="3">
          <p>
            转换时间取决于文件大小、复杂度和服务器负载。
            一般情况下，小型文档（几MB）的转换通常在几秒到几十秒内完成。
            大型或复杂的文档可能需要更长时间。
          </p>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'FileConversion',
  data() {
    return {
      fileList: [],
      conversionSettings: {
        targetFormat: ''
      },
      convertingFile: false,
      conversionProgress: 0,
      conversionStatus: '',
      statusMessage: '',
      conversionResults: [],
      pollingInterval: null
    }
  },
  computed: {
    hasCompletedResults() {
      return this.conversionResults.some(result => result.status === 'completed');
    }
  },
  methods: {
    handleRemove(file, fileList) {
      this.fileList = fileList;
    },
    handlePreview(file) {
      console.log('预览文件', file);
    },
    handleFileChange(file, fileList) {
      this.fileList = fileList;
    },
    beforeUpload(file) {
      const isSupportedType = this.checkFileType(file);
      const isLt20M = file.size / 1024 / 1024 < 20;
      
      if (!isSupportedType) {
        this.$message.error('不支持的文件格式!');
        return false;
      }
      if (!isLt20M) {
        this.$message.error('文件大小不能超过 20MB!');
        return false;
      }
      
      return true;
    },
    checkFileType(file) {
      // 支持的文件类型
      const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];
      
      return supportedTypes.includes(file.type);
    },
    getFileExtension(fileName) {
      return fileName.split('.').pop().toLowerCase();
    },
    handleSuccess(res, file) {
      this.$message.success('文件上传成功!');
      this.startPollingStatus(res.taskId, file);
    },
    handleError() {
      this.$message.error('上传失败，请重试!');
      this.convertingFile = false;
    },
    startConversion() {
      if (this.fileList.length === 0 || !this.conversionSettings.targetFormat) {
        this.$message.warning('请选择文件和目标格式!');
        return;
      }
      
      this.convertingFile = true;
      this.conversionProgress = 0;
      this.conversionStatus = '';
      this.statusMessage = '准备转换...';
      
      // 上传文件
      this.$refs.upload.submit();
    },
    
    customUpload(options) {
      const { file, onSuccess, onError, onProgress } = options;
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', this.conversionSettings.targetFormat);
      
      // 使用axios发送请求
      axios.post('/api/file/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({ percent: percentCompleted });
        }
      })
      .then(response => {
        onSuccess(response.data);
      })
      .catch(error => {
        console.error('上传失败:', error);
        onError(error);
      });
    },
    startPollingStatus(taskId, file) {
      // 将任务添加到结果列表
      this.conversionResults.unshift({
        taskId: taskId,
        fileName: file.name,
        originalFormat: this.getFileExtension(file.name),
        targetFormat: this.conversionSettings.targetFormat,
        status: 'processing',
        downloadUrl: ''
      });
      
      // 开始轮询转换状态
      this.pollingInterval = setInterval(() => {
        this.checkConversionStatus(taskId);
      }, 1000);
    },
    checkConversionStatus(taskId) {
      axios.get(`/api/file/status/${taskId}`)
        .then(response => {
          const result = response.data;
          const resultIndex = this.conversionResults.findIndex(item => item.taskId === taskId);
          
          if (resultIndex !== -1) {
            this.conversionProgress = result.progress;
            this.statusMessage = result.message || '转换中...';
            
            if (result.status === 'completed') {
              // 更新结果
              this.conversionResults[resultIndex].status = 'completed';
              this.conversionResults[resultIndex].downloadUrl = result.downloadUrl;
              
              // 清除轮询
              clearInterval(this.pollingInterval);
              
              this.$message.success('文件转换完成!');
              this.convertingFile = false;
              this.conversionStatus = 'success';
            } else if (result.status === 'failed') {
              // 转换失败
              this.conversionResults[resultIndex].status = 'failed';
              
              // 清除轮询
              clearInterval(this.pollingInterval);
              
              this.$message.error('文件转换失败: ' + (result.error || '未知错误'));
              this.convertingFile = false;
              this.conversionStatus = 'exception';
            }
          }
        })
        .catch(error => {
          console.error('获取转换状态失败', error);
        });
    },
    resetSettings() {
      this.conversionSettings = {
        targetFormat: ''
      };
      this.fileList = [];
      this.$refs.upload.clearFiles();
    },
    downloadFile(result) {
      if (result.status === 'completed' && result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `converted_${result.fileName.split('.')[0]}.${result.targetFormat}`;
        link.click();
      }
    },
    deleteResult(index) {
      this.conversionResults.splice(index, 1);
    },
    downloadAll() {
      const completedResults = this.conversionResults.filter(result => result.status === 'completed');
      completedResults.forEach(result => {
        this.downloadFile(result);
      });
    },
    clearResults() {
      this.conversionResults = [];
    }
  },
  beforeDestroy() {
    // 清除轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
</script>

<style scoped>
.tool-page {
  padding-bottom: 40px;
}

.tool-header {
  text-align: center;
  margin-bottom: 40px;
}

.tool-header h1 {
  font-size: 32px;
  color: #fb7299; /* B站粉色 */
  margin-bottom: 16px;
}

.tool-header p {
  font-size: 16px;
  color: #6d757a; /* B站次要文字颜色 */
  max-width: 600px;
  margin: 0 auto;
}

.tool-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 30px;
  margin-bottom: 40px;
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
  color: #18191c; /* B站主要文字颜色 */
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.action-buttons .el-button--primary {
  background-color: #00a1d6; /* B站蓝色 */
  border-color: #00a1d6;
}

.action-buttons .el-button--primary:hover {
  background-color: #00b5e5;
  border-color: #00b5e5;
}

.progress-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f6f7f8; /* B站背景色 */
  border-radius: 8px;
}

.progress-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #18191c;
}

.status-text {
  margin-top: 10px;
  color: #6d757a;
  font-size: 14px;
}

.result-section {
  margin-bottom: 30px;
}

.result-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #18191c;
}

.batch-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.tool-faq {
  margin-bottom: 20px;
}

.tool-faq h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #18191c;
  text-align: center;
}

/* B站风格的表格样式 */
::v-deep .el-table {
  border-radius: 8px;
  overflow: hidden;
}

::v-deep .el-table th {
  background-color: #f6f7f8;
  color: #18191c;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa;
}
</style> 