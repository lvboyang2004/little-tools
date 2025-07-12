<template>
  <div class="home-page">
    <!-- 大型横幅轮播图 -->
    <div class="banner-section">
      <el-carousel height="400px" :interval="5000" arrow="always">
        <el-carousel-item v-for="(item, index) in bannerItems" :key="index">
          <div class="banner-item" :style="{ backgroundImage: `url(${item.image})` }">
            <div class="banner-content">
              <h2>{{ item.title }}</h2>
              <p>{{ item.description }}</p>
              <el-button type="primary" size="large" @click="navigateTo(item.link)">立即使用</el-button>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 功能区块 -->
    <div class="feature-section">
      <h2 class="section-title">热门功能</h2>
      <div class="feature-grid">
        <div v-for="(feature, index) in features" :key="index" class="feature-card" @click="navigateTo(feature.link)">
          <div class="feature-icon">
            <i :class="feature.icon"></i>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <!-- 使用步骤 -->
    <div class="steps-section">
      <h2 class="section-title">如何使用</h2>
      <el-steps :active="3" finish-status="success" simple>
        <el-step title="选择工具" description="从导航栏选择您需要的在线工具"></el-step>
        <el-step title="上传文件" description="通过拖拽或浏览器上传您的文件"></el-step>
        <el-step title="处理并下载" description="等待处理完成后下载结果文件"></el-step>
      </el-steps>
    </div>
  </div>
</template>

<script>
import { bannerBase64 } from '../assets/logo.js'

export default {
  name: 'HomePage',
  data() {
    return {
      bannerItems: [
        {
          title: '免费图片压缩工具',
          description: '轻松压缩您的图片，保持高质量的同时减小文件大小',
          image: bannerBase64.compression,
          link: '/image-compression'
        },
        {
          title: '专业图片水印工具',
          description: '快速为您的图片添加文字或图片水印，保护您的知识产权',
          image: bannerBase64.watermark,
          link: '/image-watermark'
        },
        {
          title: '高效图片剪裁工具',
          description: '轻松剪裁您的图片，生成各种社交媒体所需的尺寸',
          image: bannerBase64.cropping,
          link: '/image-cropping'
        },
        {
          title: '图片格式转换工具',
          description: '快速转换图片格式，支持JPG、PNG、WebP、GIF等格式互转',
          image: bannerBase64.conversion,
          link: '/image-conversion'
        },
        {
          title: '文件格式转换工具',
          description: '便捷转换各种文档格式，满足不同场景的需求',
          image: bannerBase64.fileConversion,
          link: '/file-conversion'
        }
      ],
      features: [
        {
          title: '图片压缩',
          description: '智能压缩图片，最高可减小70%的体积',
          icon: 'el-icon-picture',
          link: '/image-compression'
        },
        {
          title: '图片水印',
          description: '添加专业的文字或图片水印',
          icon: 'el-icon-edit',
          link: '/image-watermark'
        },
        {
          title: '图片剪裁',
          description: '精确剪裁图片到所需尺寸',
          icon: 'el-icon-crop',
          link: '/image-cropping'
        },
        {
          title: '图片格式转换',
          description: '轻松转换PNG、JPG、WebP等格式',
          icon: 'el-icon-refresh',
          link: '/image-conversion'
        },
        {
          title: '文件转换',
          description: '多种文件格式互相转换',
          icon: 'el-icon-document',
          link: '/file-conversion'
        }
      ]
    }
  },
  methods: {
    navigateTo(link) {
      this.$router.push(link)
    }
  }
}
</script>

<style scoped>
.home-page {
  padding-bottom: 40px;
}

.banner-section {
  margin-bottom: 40px;
}

.banner-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  position: relative;
}

.banner-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

.banner-content {
  position: relative;
  color: white;
  max-width: 600px;
  margin-left: 80px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-content h2 {
  font-size: 36px;
  margin-bottom: 16px;
}

.banner-content p {
  font-size: 18px;
  margin-bottom: 24px;
  opacity: 0.9;
}

.section-title {
  text-align: center;
  font-size: 28px;
  margin-bottom: 30px;
  color: #2c3e50;
  position: relative;
  padding-bottom: 15px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: #fb7299;
}

/* 功能区块样式 */
.feature-section {
  padding: 40px 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.feature-card {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 48px;
  color: #fb7299;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #2c3e50;
}

.feature-card p {
  color: #606266;
  font-size: 14px;
}

/* 步骤说明样式 */
.steps-section {
  padding: 40px 0;
  background-color: #f9f9f9;
  margin: 40px 0;
}
</style> 