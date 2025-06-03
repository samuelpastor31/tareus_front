<script setup>
import { RouterLink } from "vue-router";
import { useDataStore } from "../stores/index.js";
import { ref } from "vue";

const auth = useDataStore();
const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
const closeSidebar = () => {
  isSidebarOpen.value = false;
};
</script>

<template>
  <template v-if="auth.loggedIn">
    <aside class="sidebar-mobile d-md-none" :class="{ expanded: isSidebarOpen }">
      <button class="sidebar-toggle" @click="toggleSidebar" :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'">
        <i :class="isSidebarOpen ? 'bi bi-chevron-left' : 'bi bi-chevron-right'"></i>
      </button>
      <nav>
        <RouterLink to="/projects" class="sidebar-icon" @click="closeSidebar">
          <i class="bi bi-kanban"></i>
          <span v-if="isSidebarOpen">View Projects</span>
        </RouterLink>
        <RouterLink to="/settings" class="sidebar-icon" @click="closeSidebar">
          <i class="bi bi-gear"></i>
          <span v-if="isSidebarOpen">Settings</span>
        </RouterLink>
        <RouterLink to="/" class="sidebar-icon" @click.prevent="() => { auth.logout(); closeSidebar(); }">
          <i class="bi bi-box-arrow-left"></i>
          <span v-if="isSidebarOpen">Log out</span>
        </RouterLink>
      </nav>
    </aside>

    <header class="topbar d-none d-md-flex">
      <nav class="nav-bar">
        <RouterLink to="/projects" class="nav-btn">
          <i class="bi bi-kanban"></i> View Projects
        </RouterLink>
        <RouterLink to="/settings" class="nav-btn">
          <i class="bi bi-gear"></i> Settings
        </RouterLink>
        <RouterLink to="/" class="nav-btn" @click.prevent="auth.logout">
          <i class="bi bi-box-arrow-left"></i> Log out
        </RouterLink>
      </nav>
    </header>
  </template>
</template>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css");

.sidebar-mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 56px;
  background: linear-gradient(180deg, #43cea2 0%, #185a9d 100%);
  box-shadow: 2px 0 16px rgba(24, 90, 157, 0.10);
  z-index: 300;
  padding: 1.5rem 0.3rem 1.5rem 0.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: width 0.2s cubic-bezier(.55, 0, .1, 1);
  gap: 1rem;
  overflow: hidden;
}

.sidebar-mobile.expanded {
  width: 180px;
  align-items: flex-start;
  padding-left: 0.5rem;
  overflow: hidden;
}

.sidebar-toggle {
  background: #fff;
  border: none;
  color: #185a9d;
  font-size: 1.3rem;
  border-radius: 50%;
  width: 36px;
  height: 30px;
  margin-bottom: 1.5rem;
  margin-left: 0.2rem;
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, color 0.18s;
  max-width: 100%;
  overflow: hidden;
  align-self: flex-start;
}

.sidebar-toggle:hover {
  background: #43cea2;
  color: #fff;
}

.sidebar-mobile nav {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  align-items: flex-start;
}

.sidebar-icon {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  color: #fff;
  font-size: 1.25rem;
  border-radius: 10px;
  padding: 0.5rem 0.7rem;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  box-sizing: border-box;
  border: 2px solid transparent;
  justify-content: flex-start;
}

.sidebar-icon span {
  font-size: 1.08rem;
  color: #fff;
  font-weight: 500;
  transition: opacity 0.18s, color 0.18s;
  opacity: 1;
}

.sidebar-icon:hover,
.sidebar-icon.router-link-exact-active {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.sidebar-icon.router-link-exact-active {
  border: 2px solid #fff;
}

.sidebar-icon.router-link-exact-active i,
.sidebar-icon.router-link-exact-active span {
  color: #fff !important;
}

.sidebar-icon:hover i,
.sidebar-icon:hover span {
  color: #fff !important;
}

.topbar {
  width: 100%;
  min-height: 40px;
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  border-radius: 20px;
  margin-bottom: 1rem;
  padding: 0.2rem 0;
  margin-left: 0;
}

@media (max-width: 767.98px) {
  .topbar {
    display: none !important;
  }

  .nav-bar {
    display: none !important;
  }
}

.logo {
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2px;
  text-shadow: 1px 2px 8px rgba(24, 90, 157, 0.2);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  transition: color 0.18s;
}

.logo:hover {
  color: #fff;
}

.nav-bar {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin: 0.5rem 0;
  padding: 0.5rem 1.5rem;
  border-radius: 16px;
  background: transparent;
  box-shadow: none;
  min-height: 54px;
  align-items: center;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1.1rem;
  color: #185a9d;
  font-weight: 500;
  padding: 0.7rem 1.2rem;
  border-radius: 12px;
  background: #f0faf7;
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.08);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  text-decoration: none;
  border: none;
  height: 44px;
}

.nav-btn:hover,
.nav-btn.router-link-exact-active {
  background: linear-gradient(90deg, #b2f7ef 0%, #a6c1ee 100%); color: #185a9d;
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.10);
}

@media (max-width: 767.98px) {
  .nav-bar {
    display: none !important;
  }
}

@media (min-width: 768px) {
  .sidebar-mobile {
    display: none !important;
  }

  .nav-bar {
    display: flex !important;
  }
}
</style>
