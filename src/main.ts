import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

import './index.css'
import App from './App.vue'

createApp(App).use(VueQueryPlugin).mount('#app')
