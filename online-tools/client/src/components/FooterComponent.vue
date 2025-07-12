<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-column">
          <h3>联系我们</h3>
          <p>邮箱: 1258065064@qq.com</p>
          <p>微信: 17863416665</p>
          <div class="social-icons">
            <a href="#" class="social-icon">
              <i class="el-icon-s-platform"></i>
            </a>
            <a href="#" class="social-icon">
              <i class="el-icon-s-custom"></i>
            </a>
            <a href="#" class="social-icon">
              <i class="el-icon-s-promotion"></i>
            </a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© {{ currentYear }} 在线工具 - 提供免费在线工具服务</p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'FooterComponent',
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
.footer {
  background-color: #2c3e50;
  color: #ffffff;
  padding: 40px 0 20px;
  margin-top: 40px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}

.footer-content {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.footer-column {
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}

.footer-column h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #fb7299;
}

.footer-column p {
  color: #b1b7c3;
  margin: 8px 0;
}

.social-icons {
  display: flex;
  margin-top: 15px;
  justify-content: center;
}

.social-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #384a5f;
  color: #ffffff;
  margin: 0 5px;
  transition: background-color 0.3s;
}

.social-icon:hover {
  background-color: #fb7299;
}

.footer-bottom {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #384a5f;
  text-align: center;
}

.footer-bottom p {
  color: #b1b7c3;
  font-size: 14px;
}
</style> 