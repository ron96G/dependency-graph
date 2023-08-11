import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { defineCustomElements } from '@telekom/scale-components/loader';
import '@telekom/scale-components/dist/scale-components/scale-components.css';
import { store } from './store';


defineCustomElements();

const app = createApp(App)
app.use(store)
app.mount('#app')
