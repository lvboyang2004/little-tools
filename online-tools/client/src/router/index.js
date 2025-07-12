import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import ImageCompression from '../pages/ImageCompression.vue'
import ImageWatermark from '../pages/ImageWatermark.vue'
import ImageCropping from '../pages/ImageCropping.vue'
import ImageConversion from '../pages/ImageConversion.vue'
import FileConversion from '../pages/FileConversion.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomePage,
        meta: {
            title: '在线工具 - 首页'
        }
    },
    {
        path: '/image-compression',
        name: 'image-compression',
        component: ImageCompression,
        meta: {
            title: '在线工具 - 图片压缩'
        }
    },
    {
        path: '/image-watermark',
        name: 'image-watermark',
        component: ImageWatermark,
        meta: {
            title: '在线工具 - 图片水印'
        }
    },
    {
        path: '/image-cropping',
        name: 'image-cropping',
        component: ImageCropping,
        meta: {
            title: '在线工具 - 图片剪裁'
        }
    },
    {
        path: '/image-conversion',
        name: 'image-conversion',
        component: ImageConversion,
        meta: {
            title: '在线工具 - 图片格式转换'
        }
    },
    {
        path: '/file-conversion',
        name: 'file-conversion',
        component: FileConversion,
        meta: {
            title: '在线工具 - 文件转换'
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '在线工具'
    next()
})

export default router 