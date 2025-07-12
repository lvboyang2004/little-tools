<template>
  <div class="app-container">
    <header-component />
    <div class="main-content">
      <router-view />
    </div>
    <footer-component />
  </div>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue'
import FooterComponent from './components/FooterComponent.vue'

export default {
  name: 'App',
  components: {
    HeaderComponent,
    FooterComponent
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f6f7f9;
  color: #333;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
</style> 