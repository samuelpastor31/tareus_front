import { createRouter, createWebHistory } from "vue-router";
import About from "../views/About.vue";
import Settings from "../views/Settings.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import ProjectsList from "../views/ProjectsList.vue";
import ProjectView from "../views/ProjectView.vue";
import MyTasks from "../views/MyTasks.vue";
import Reports from "../views/Reports.vue";

const routes = [
  { path: "/", name: "Login", component: LoginView },
  { path: "/register", name: "Register", component: RegisterView },
  { path: "/projects", name: "Projects", component: ProjectsList },
  { path: "/project/:id/tasks", name: "ProjectTasks", component: ProjectView },
  { path: "/my-tasks", name: "MyTasks", component: MyTasks },
  { path: "/reports", name: "Reports", component: Reports },
  { path: "/about", name: "About", component: About },
  { path: "/settings", name: "Settings", component: Settings },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;