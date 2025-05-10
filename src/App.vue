<script>
import { RouterLink, RouterView } from 'vue-router';
import AppMenu from './components/AppMenu.vue';
import { useDataStore } from './stores/index.js';
import tareusLogo from '/vite.svg';

export default {
  components: {
    AppMenu,
  },
  data() {
    return { tareusLogo };
  },
  methods: {
    async populate() {
      const store = useDataStore();
      await Promise.all([
      ]);
    },
  },
  async mounted() {
    await this.populate();
  },
};
</script>

<template>
  <div class="tareus-app-bg">
    <header class="tareus-header">
      <img :src="tareusLogo" alt="Tareus Logo" />
      <h1>Tareus</h1>
    </header>
    <div class="app-menu-bar">
      <div class="app-menu-inner">
        <app-menu />
      </div>
    </div>
    <main class="tareus-main-content">
      <router-view />
    </main>
    <footer>
      Tareus - Your Task Manager
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.tareus-app-bg {
  min-height: 100vh;
  background: linear-gradient(120deg, #e0f7fa 0%, #f5f7fa 100%);
  display: flex;
  flex-direction: column;
  width: 100vw;
  max-width: 100vw;
  overflow-x: hidden;
}

.tareus-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  padding: 1.2rem 2rem 0.5rem 2rem;
  margin-bottom: 0.2rem;
  z-index: 2;
  max-width: 100vw;
  box-sizing: border-box;
}
.tareus-header img {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(24,90,157,0.10);
  background: #fff;
  padding: 0.2rem;
}
.tareus-header h1 {
  font-size: 2.1rem;
  font-weight: bold;
  color: #185a9d;
  margin: 0.5rem 0 0 0;
  letter-spacing: 1px;
}

.app-menu-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}
.app-menu-inner {
  width: 100%;
  max-width: 1200px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tareus-main-content {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
  margin-left: 0;
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  align-self: center;
  box-sizing: border-box;
}

footer {
  margin-top: 2rem;
  text-align: center;
  color: #7f8c8d;
  padding-bottom: 1.5rem;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 1200px) {
  .app-menu-inner,
  .tareus-main-content {
    max-width: 100vw;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}

@media (max-width: 767.98px) {
  .tareus-header {
    padding: 1.2rem 1rem 0.5rem 1rem;
  }
  .app-menu-inner,
  .tareus-main-content {
    padding-left: 0.2rem;
    padding-right: 0.2rem;
  }
  .tareus-main-content {
    margin-left: 150px; 
    transition: margin-left 0.2s cubic-bezier(.55,0,.1,1);
  }
}
</style>
