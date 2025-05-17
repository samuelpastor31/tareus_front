import { createRouter, createWebHistory } from 'vue-router';
import About from '../views/About.vue';
import CreateProject from '../views/CreateProject.vue';
import Settings from '../views/Settings.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ProjectsList from '../views/ProjectsList.vue';
import ProjectView from '../views/ProjectView.vue';

const routes = [
  { path: '/', name: 'Login', component: LoginView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/projects', name: 'Projects', component: ProjectsList },
  { path: '/project/:id/tasks', name: 'ProjectTasks', component: ProjectView },
  { path: '/about', name: 'About', component: About },
  { path: '/create-project', name: 'CreateProject', component: CreateProject },
  { path: '/settings', name: 'Settings', component: Settings },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;