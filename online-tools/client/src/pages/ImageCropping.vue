<template>
  <div class="tool-page bilibili-style">
    <div class="tool-header">
      <h1>图片裁剪</h1>
      <p>精确裁剪您的图片，生成各种所需尺寸</p>
    </div>
    <div class="tool-container">
      <!-- 上传区域 -->
      <div class="upload-section" v-if="!imageUrl">
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeUpload"
          :file-list="fileList"
          :limit="1"
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

      <!-- 裁剪区域 -->
      <div class="crop-container" v-if="imageUrl">
        <h2>图片裁剪预览</h2>
        <div class="cropper-wrap">
          <vue-cropper
            ref="cropper"
            :img="imageUrl"
            :outputSize="1"
            :outputType="cropOptions.outputType"
            :info="true"
            :full="false"
            :canMove="true"
            :canMoveBox="false"
            :original="false"
            :autoCrop="true"
            :autoCropWidth="cropOptions.autoCropWidth"
            :autoCropHeight="cropOptions.autoCropHeight"
            :fixedBox="false"
            :fixed="cropOptions.fixed"
            :fixedNumber="cropOptions.fixedNumber"
            :centerBox="true"
            :infoTrue="true"
            :mode="cropOptions.mode"
            :round="cropOptions.round"
            @realTime="realTime"
          ></vue-cropper>
        </div>

        <!-- 裁剪设置 -->
        <div class="crop-settings">
          <!-- 裁剪形状 -->
          <div class="setting-group">
            <h3>裁剪形状</h3>
            <el-radio-group v-model="cropOptions.shape" @change="changeShape">
              <el-radio label="rect">自由</el-radio>
              <el-radio label="square">正方形</el-radio>
              <el-radio label="circle">圆形</el-radio>
            </el-radio-group>
          </div>

          <!-- 裁剪比例 -->
          <div class="setting-group" v-if="cropOptions.shape !== 'circle'">
            <h3>裁剪比例</h3>
            <el-radio-group v-model="cropOptions.ratio" @change="changeRatio">
              <el-radio label="free">自由</el-radio>
              <el-radio label="1:1">1:1</el-radio>
              <el-radio label="4:3">4:3</el-radio>
              <el-radio label="16:9">16:9</el-radio>
            </el-radio-group>
            <div class="ratio-preview" v-if="cropOptions.ratio !== 'free'">
              <div class="ratio-box" :style="getRatioStyle()"></div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions">
            <el-button 
              type="primary" 
              @click="applyCrop"
              :loading="isProcessing"
            >
              应用裁剪
            </el-button>
            <el-button @click="resetImage">重新上传</el-button>
            <el-button @click="rotateImage(-90)">向左旋转</el-button>
            <el-button @click="rotateImage(90)">向右旋转</el-button>
          </div>
        </div>
      </div>

      <!-- 裁剪结果 -->
      <div class="result-section" v-if="resultUrl">
        <h2>裁剪结果</h2>
        <div class="result-container">
          <div class="result-image">
            <img :src="resultUrl" alt="裁剪结果" />
          </div>
          <div class="result-actions">
            <el-button type="success" @click="downloadImage">下载图片</el-button>
            <el-button @click="resetResult">重新裁剪</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

export default {
  name: 'ImageCropping',
  components: {
    VueCropper
  },
  data() {
    return {
      fileList: [],
      imageUrl: null,
      cropperData: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      cropOptions: {
        outputType: 'png',
        shape: 'rect',
        ratio: 'free',
        mode: 'contain',
        autoCropWidth: 200,
        autoCropHeight: 200,
        fixed: false,
        fixedNumber: [0, 0],
        round: false
      },
      resultUrl: null,
      isProcessing: false
    }
  },
  methods: {
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
    handleFileChange(file) {
      if (file && file.raw) {
        this.fileList = [file];
        this.imageUrl = URL.createObjectURL(file.raw);
        this.resultUrl = null;
      }
    },
    changeShape(shape) {
      // 更新裁剪形状
      if (shape === 'circle') {
        this.cropOptions.round = true;
        this.cropOptions.fixed = true;
        this.cropOptions.ratio = '1:1';
        this.cropOptions.fixedNumber = [1, 1];
      } else if (shape === 'square') {
        this.cropOptions.round = false;
        this.cropOptions.fixed = true;
        this.cropOptions.ratio = '1:1';
        this.cropOptions.fixedNumber = [1, 1];
      } else {
        this.cropOptions.round = false;
        this.cropOptions.fixed = false;
        this.cropOptions.ratio = 'free';
        this.cropOptions.fixedNumber = [0, 0];
      }
      
      // 重置裁剪框以应用新形状
      this.$nextTick(() => {
        if (this.$refs.cropper) {
          this.$refs.cropper.refresh();
          
          // 对于圆形，需要特殊处理
          if (shape === 'circle') {
            // 确保裁剪区域为正方形
            const box = this.$refs.cropper.cropW;
            const size = Math.min(box, this.$refs.cropper.cropH);
            this.$refs.cropper.cropW = size;
            this.$refs.cropper.cropH = size;
          }
        }
      });
    },
    changeRatio(ratio) {
      // 更新裁剪比例
      switch (ratio) {
        case '1:1':
          this.cropOptions.fixedNumber = [1, 1];
          this.cropOptions.fixed = true;
          break;
        case '4:3':
          this.cropOptions.fixedNumber = [4, 3];
          this.cropOptions.fixed = true;
          break;
        case '16:9':
          this.cropOptions.fixedNumber = [16, 9];
          this.cropOptions.fixed = true;
          break;
        default:
          this.cropOptions.fixedNumber = [0, 0];
          this.cropOptions.fixed = false;
      }
      
      // 重置裁剪框以应用新比例
      this.$nextTick(() => {
        if (this.$refs.cropper) {
          this.$refs.cropper.refresh();
        }
      });
    },
    realTime(data) {
      this.cropperData = data;
    },
    rotateImage(angle) {
      this.$refs.cropper.rotateRight(angle);
    },
    resetImage() {
      this.imageUrl = null;
      this.fileList = [];
      this.resultUrl = null;
      this.cropperData = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    },
    resetResult() {
      this.resultUrl = null;
    },
    async applyCrop() {
      if (!this.imageUrl || !this.$refs.cropper) {
        this.$message.warning('请先上传图片');
        return;
      }
      
      try {
        this.isProcessing = true;
        
        // 获取裁剪数据
        this.$refs.cropper.getCropData(async (data) => {
          // data是base64格式的图片数据
          
          // 将base64转换为blob
          const blob = this.dataURLtoBlob(data);
          const file = new File([blob], 'cropped.png', { type: 'image/png' });
          
          // 创建FormData对象
          const formData = new FormData();
          formData.append('image', file);
          formData.append('round', this.cropOptions.round.toString());
          
          try {
            // 发送到后端
            const response = await fetch('/api/image/crop', {
              method: 'POST',
              body: formData
            }).then(res => res.json());
            
            if (response.success) {
              this.resultUrl = response.url;
              this.$message.success('裁剪成功!');
            } else {
              this.$message.error('裁剪失败: ' + response.message);
            }
          } catch (error) {
            console.error('裁剪出错:', error);
            this.$message.error('裁剪失败: ' + (error.message || '未知错误'));
          } finally {
            this.isProcessing = false;
          }
        });
      } catch (error) {
        console.error('获取裁剪数据失败:', error);
        this.$message.error('获取裁剪数据失败: ' + (error.message || '未知错误'));
        this.isProcessing = false;
      }
    },
    downloadImage() {
      if (!this.resultUrl) {
        this.$message.warning('没有可下载的图片');
        return;
      }
      
      const link = document.createElement('a');
      link.href = this.resultUrl;
      link.download = 'cropped_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    dataURLtoBlob(dataurl) {
      // 将base64转换为blob对象
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new Blob([u8arr], { type: mime });
    },
    getRatioStyle() {
      let width = 100;
      let height = 100;
      
      switch (this.cropOptions.ratio) {
        case '1:1':
          width = 60;
          height = 60;
          break;
        case '4:3':
          width = 80;
          height = 60;
          break;
        case '16:9':
          width = 80;
          height = 45;
          break;
      }
      
      return {
        width: width + 'px',
        height: height + 'px'
      };
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

h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--bili-text);
}

.crop-container {
  margin-bottom: 30px;
}

.cropper-wrap {
  height: 400px;
  background-color: #f5f5f5;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 20px;
}

.crop-settings {
  margin-top: 20px;
}

.setting-group {
  margin-bottom: 15px;
}

.actions {
  margin-top: 25px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.result-section {
  margin-top: 30px;
}

.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-image {
  max-width: 100%;
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.result-image img {
  max-width: 100%;
  display: block;
}

.result-actions {
  display: flex;
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

:deep(.el-button--primary) {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

:deep(.el-button--success) {
  background-color: var(--bili-blue);
  border-color: var(--bili-blue);
}

/* 裁剪组件样式覆盖 */
:deep(.vue-cropper) {
  background-color: #f5f5f5;
}

.ratio-preview {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.ratio-box {
  background-color: rgba(0, 174, 236, 0.2);
  border: 2px solid var(--bili-blue);
  border-radius: 4px;
}
</style> 