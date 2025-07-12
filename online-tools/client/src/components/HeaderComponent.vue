<template>
  <header class="header">
    <div class="header-container">
      <div class="logo-section">
        <router-link to="/" class="logo-link">
          <div class="logo">
            <img :src="logoImage" alt="在线工具" class="logo-img" />
            <span class="logo-text">在线工具</span>
          </div>
        </router-link>
      </div>
      <nav class="navigation">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/image-compression" class="nav-link">图片压缩</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/image-watermark" class="nav-link">图片水印</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/image-cropping" class="nav-link">图片剪裁</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/image-conversion" class="nav-link">图片格式转换</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/file-conversion" class="nav-link">文件转换</router-link>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script>
import { logoBase64 } from '../assets/logo.js'

export default {
  name: 'HeaderComponent',
  data() {
    return {
      logoImage: logoBase64
    }
  }
}
</script>

<style scoped>
.header {
  background-color: #ffffff;
  height: 64px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 32px;
  margin-right: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #fb7299;
}

.navigation {
  flex-grow: 1;
  margin: 0 30px;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 0 15px;
}

.nav-link {
  color: #505050;
  text-decoration: none;
  font-size: 14px;
  display: block;
  padding: 6px 0;
  position: relative;
  transition: color 0.3s;
}

.nav-link:hover, .router-link-active {
  color: #fb7299;
}

.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #fb7299;
}
</style> 