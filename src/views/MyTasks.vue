<script>
import { useDataStore } from "../stores/index.js";
import { mapState, mapActions } from "pinia";
import TaskComments from '../components/TaskComments.vue';

export default {
    name: 'MyTasks',
    components: {
        TaskComments,
    }, data() {
        return {
            loading: false,
            error: null,
            statusFilter: '',
            priorityFilter: '',
            projectFilter: '',
            selectedTask: null,
            showComments: false,
            currentProjectUsers: [],
        };
    },
    computed: {
        ...mapState(useDataStore, ['projects', 'myTasks']),

        projectsList() {
            // Get unique projects from ALL tasks (not filtered ones)
            const projectIds = [...new Set(this.myTasks.map(task => task.project_id))];
            return this.projects.filter(project => projectIds.includes(project.id));
        },

        filteredTasks() {
            return this.myTasks.filter(task => {
                if (this.statusFilter && task.status !== this.statusFilter) return false;
                if (this.priorityFilter && task.priority !== this.priorityFilter) return false;
                if (this.projectFilter && task.project_id !== parseInt(this.projectFilter)) return false;
                return true;
            });
        },

        totalTasks() {
            return this.filteredTasks.length;
        },

        pendingTasks() {
            return this.filteredTasks.filter(task => task.status === 'pending').length;
        },

        inProgressTasks() {
            return this.filteredTasks.filter(task => task.status === 'in_progress').length;
        },

        completedTasks() {
            return this.filteredTasks.filter(task => task.status === 'completed').length;
        },
    },
    setup() {
        const store = useDataStore();
        return { store };
    },
    methods: {
        ...mapActions(useDataStore, ['fetchProjects', 'fetchMyTasks']),

        async loadMyTasks() {
            this.loading = true;
            this.error = null;

            try {
                // Use the store method to fetch user tasks
                await this.fetchMyTasks();

                // Ensure we also have projects loaded for filtering
                if (this.projects.length === 0) {
                    await this.fetchProjects();
                }

            } catch (error) {
                console.error('Error loading my tasks:', error);
                this.error = 'Failed to load your tasks. Please try again.';
            } finally {
                this.loading = false;
            }
        },

        getProjectName(projectId) {
            // First try to get from the task's Project relationship
            const task = this.myTasks.find(t => t.project_id === projectId);
            if (task && task.Project) {
                return task.Project.name;
            }

            // Fallback to the projects state
            const project = this.projects.find(p => p.id === projectId);
            return project ? project.name : 'Unknown Project';
        },

        formatStatus(status) {
            const statusMap = {
                'pending': '🟡 Pending',
                'in_progress': '🔵 In Progress',
                'completed': '🟢 Completed'
            };
            return statusMap[status] || status;
        },

        formatPriority(priority) {
            const priorityMap = {
                'high': '🔴 High',
                'medium': '🟡 Medium',
                'low': '🟢 Low'
            };
            return priorityMap[priority] || priority;
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return 'Invalid Date';
            }
        },

        openTaskInProject(task) {
            // Navigate to the project where the task is located
            this.$router.push(`/project/${task.project_id}/tasks`);
        }, async openTaskComments(task) {
            this.selectedTask = task;
            this.showComments = true;

            // Load project users for the TaskComments component
            try {
                this.currentProjectUsers = await this.store.fetchProjectUsers(task.project_id);
            } catch (error) {
                console.error('Error loading project users:', error);
                this.currentProjectUsers = [];
            }
        },

        closeComments() {
            this.showComments = false;
            this.selectedTask = null;
            this.currentProjectUsers = [];
        },

        // Permission utility methods
        getUserRole(userPermissions) {
            if (!userPermissions) return 'No Access';

            if (userPermissions.isOwner) {
                return 'Owner';
            } else if (userPermissions.can_create && userPermissions.can_edit && userPermissions.can_view) {
                return 'Admin';
            } else if (userPermissions.can_edit && userPermissions.can_view) {
                return 'Editor';
            } else if (userPermissions.can_view) {
                return 'Viewer';
            }
            return 'No Access';
        },

        getRoleClass(userPermissions) {
            const role = this.getUserRole(userPermissions).toLowerCase().replace(' ', '-');
            return `role-${role}`;
        },

        getProjectUsers(projectId) {
            // Return the current project users that were loaded when opening the modal
            return this.currentProjectUsers;
        },        // Check if user can edit tasks in the project
        canEditTask(task) {
            if (!task.Project || !task.Project.UserPermissions) {
                return false;
            }
            const permissions = task.Project.UserPermissions;
            return permissions.isOwner || permissions.can_edit;
        },
    },

    async created() {
        await this.loadMyTasks();
    },
};
</script>

<template>
    <div class="my-tasks-container">
        <div class="header-section">
            <h1 class="page-title">
                <i class="bi bi-check2-square"></i>
                My Tasks
            </h1>
            <p class="page-subtitle">All tasks assigned to you across all projects</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
            <div class="spinner"></div>
            <p>Loading your tasks...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
            <div class="error-content">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error Loading Tasks</h3>
                <p>{{ error }}</p>
                <button @click="loadMyTasks" class="retry-btn">
                    <i class="bi bi-arrow-clockwise"></i>
                    Try Again
                </button>
            </div>
        </div>

        <!-- No Tasks State -->
        <div v-else-if="!myTasks.length" class="no-tasks-container">
            <div class="no-tasks-content">
                <i class="bi bi-check2-square"></i>
                <h3>No Tasks Assigned</h3>
                <p>You don't have any tasks assigned to you at the moment.</p>
                <router-link to="/projects" class="projects-btn">
                    <i class="bi bi-kanban"></i>
                    View Projects
                </router-link>
            </div>
        </div>

        <!-- Tasks Content -->
        <div v-else class="tasks-content">
            <!-- Filter and Summary Section -->
            <div class="filters-section">
                <div class="summary-stats">
                    <div class="stat-card">
                        <div class="stat-number">{{ totalTasks }}</div>
                        <div class="stat-label">Total Tasks</div>
                    </div>
                    <div class="stat-card pending">
                        <div class="stat-number">{{ pendingTasks }}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat-card in-progress">
                        <div class="stat-number">{{ inProgressTasks }}</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                    <div class="stat-card completed">
                        <div class="stat-number">{{ completedTasks }}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>

                <div class="filters">
                    <select v-model="statusFilter" class="filter-select">
                        <option value="">All Status</option>
                        <option value="pending">🟡 Pending</option>
                        <option value="in_progress">🔵 In Progress</option>
                        <option value="completed">🟢 Completed</option>
                    </select>

                    <select v-model="priorityFilter" class="filter-select">
                        <option value="">All Priorities</option>
                        <option value="high">🔴 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>

                    <select v-model="projectFilter" class="filter-select">
                        <option value="">All Projects</option>
                        <option v-for="project in projectsList" :key="project.id" :value="project.id">
                            {{ project.name }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Tasks List -->
            <div class="tasks-list">
                <div v-for="task in filteredTasks" :key="task.id" class="task-card">
                    <div class="task-header">
                        <div class="task-title-section">
                            <h3 class="task-title">{{ task.title }}</h3>
                            <span class="task-id">#{{ task.id }}</span>
                        </div>
                        <div class="task-project-info">
                            <div class="task-project">
                                <i class="bi bi-folder"></i>
                                {{ getProjectName(task.project_id) }} <span class="project-id">#{{ task.project_id
                                    }}</span>
                            </div>
                            <div class="task-permissions" v-if="task.Project && task.Project.UserPermissions">
                                <span class="permission-badge" :class="getRoleClass(task.Project.UserPermissions)">
                                    {{ getUserRole(task.Project.UserPermissions) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="task-description">
                        {{ task.description }}
                    </div>

                    <div class="task-metadata">
                        <div class="task-status-priority">
                            <span :class="['status-badge', `status-${task.status}`]">
                                {{ formatStatus(task.status) }}
                            </span>
                            <span :class="['priority-badge', `priority-${task.priority}`]">
                                {{ formatPriority(task.priority) }}
                            </span>
                        </div>

                        <div class="task-dates">
                            <div class="task-date">
                                <i class="bi bi-calendar-plus"></i>
                                Created: {{ formatDate(task.createdAt) }}
                            </div>
                            <div v-if="task.updatedAt !== task.createdAt" class="task-date">
                                <i class="bi bi-calendar-check"></i>
                                Updated: {{ formatDate(task.updatedAt) }}
                            </div>
                        </div>
                    </div>

                    <div class="task-actions">
                        <button @click="openTaskInProject(task)" class="action-btn view-btn">
                            <i class="bi bi-eye"></i>
                            View in Project
                        </button>
                        <button @click="openTaskComments(task)" class="action-btn comments-btn">
                            <i class="bi bi-chat-dots"></i>
                            Comments
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Task Comments Modal -->
        <Teleport to="body">
            <TaskComments v-if="selectedTask" :task-id="selectedTask.id" :task="selectedTask"
                :project-users="getProjectUsers(selectedTask.project_id)" :is-visible="showComments"
                :can-edit="canEditTask(selectedTask)" @close="closeComments" />
        </Teleport>
    </div>
</template>

<style scoped>
.my-tasks-container {
    padding: 2rem;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
}

.tasks-content {
    width: 100%;
    box-sizing: border-box;
}

.header-section {
    text-align: center;
    margin-bottom: 2rem;
}

.page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #185a9d;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.page-title i {
    font-size: 2.2rem;
    color: #43cea2;
}

.page-subtitle {
    font-size: 1.1rem;
    color: #666;
    margin: 0;
}

.loading-container,
.error-container,
.no-tasks-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(67, 206, 162, 0.3);
    border-top: 4px solid #43cea2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.error-content,
.no-tasks-content {
    background: white;
    padding: 3rem;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(24, 90, 157, 0.1);
    border: 1px solid rgba(67, 206, 162, 0.2);
}

.error-content i,
.no-tasks-content i {
    font-size: 3rem;
    color: #43cea2;
    margin-bottom: 1rem;
}

.error-content h3,
.no-tasks-content h3 {
    color: #185a9d;
    margin-bottom: 1rem;
}

.retry-btn,
.projects-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    margin-top: 1rem;
}

.retry-btn:hover,
.projects-btn:hover {
    background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
    transform: translateY(-2px);
    color: white;
}

.filters-section {
    background: white;
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(24, 90, 157, 0.1);
    border: 1px solid rgba(67, 206, 162, 0.2);
    margin-bottom: 2rem;
    width: 100%;
    box-sizing: border-box;
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
    width: 100%;
    box-sizing: border-box;
    grid-auto-rows: minmax(80px, auto);
    /* Altura mínima de fila */
    align-items: stretch;
    /* Hace que todas las cards tengan la misma altura */
}

.stat-card {
    text-align: center;
    padding: 1rem;
    border-radius: 12px;
    background: linear-gradient(135deg, #f8fafc 0%, #e0f7fa 100%);
    border: 2px solid rgba(67, 206, 162, 0.2);
    min-width: 0;
    /* Permite que el contenido se ajuste */
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
    /* Evita que se encoja */
}

.stat-card.pending {
    border-color: rgba(249, 168, 37, 0.3);
    background: linear-gradient(135deg, rgba(249, 168, 37, 0.1) 0%, #ffffff 100%);
}

.stat-card.in-progress {
    border-color: rgba(24, 90, 157, 0.3);
    background: linear-gradient(135deg, rgba(24, 90, 157, 0.1) 0%, #ffffff 100%);
}

.stat-card.completed {
    border-color: rgba(67, 206, 162, 0.3);
    background: linear-gradient(135deg, rgba(67, 206, 162, 0.1) 0%, #ffffff 100%);
}

.stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #185a9d;
}

.stat-label {
    font-size: 0.9rem;
    color: #666;
    font-weight: 500;
}

.filters {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-select {
    padding: 0.5rem 1rem;
    border: 2px solid rgba(67, 206, 162, 0.2);
    border-radius: 8px;
    background: white;
    font-size: 0.9rem;
    color: #333;
    min-width: 150px;
}

.filter-select:focus {
    outline: none;
    border-color: #43cea2;
    box-shadow: 0 0 0 3px rgba(67, 206, 162, 0.1);
}

.tasks-list {
    display: grid;
    gap: 1.5rem;
}

.task-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(24, 90, 157, 0.1);
    border: 1px solid rgba(67, 206, 162, 0.2);
    padding: 1.5rem;
    transition: all 0.3s ease;
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(24, 90, 157, 0.15);
}

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.task-title-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.task-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #185a9d;
    margin: 0;
}

.task-id {
    background: rgba(67, 206, 162, 0.1);
    color: #43cea2;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
}

.project-id {
    background: rgba(24, 90, 157, 0.1);
    color: #185a9d;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
}

.task-project {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
    font-weight: 500;
}

.task-project-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
}

.task-permissions {
    display: flex;
    align-items: center;
}

.permission-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.task-description {
    color: #666;
    line-height: 1.5;
    margin-bottom: 1rem;
    background: rgba(245, 247, 250, 0.8);
    padding: 0.75rem;
    border-radius: 8px;
    border-left: 3px solid rgba(67, 206, 162, 0.3);
}

.task-metadata {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1rem;
}

.task-status-priority {
    display: flex;
    gap: 0.75rem;
}

.status-badge,
.priority-badge {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status-pending {
    background: rgba(249, 168, 37, 0.1);
    color: #f9a825;
    border: 1px solid rgba(249, 168, 37, 0.3);
}

.status-in_progress {
    background: rgba(24, 90, 157, 0.1);
    color: #185a9d;
    border: 1px solid rgba(24, 90, 157, 0.3);
}

.status-completed {
    background: rgba(67, 206, 162, 0.1);
    color: #43cea2;
    border: 1px solid rgba(67, 206, 162, 0.3);
}

.priority-high {
    background: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.3);
}

.priority-medium {
    background: rgba(249, 168, 37, 0.1);
    color: #f9a825;
    border: 1px solid rgba(249, 168, 37, 0.3);
}

.priority-low {
    background: rgba(67, 206, 162, 0.1);
    color: #43cea2;
    border: 1px solid rgba(67, 206, 162, 0.3);
}

/* Permission Badge Styles */
.role-owner {
    background: linear-gradient(135deg, #ff6b6b 0%, #e63946 100%);
    color: white;
}

.role-admin {
    background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
    color: white;
}

.role-editor {
    background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%);
    color: white;
}

.role-viewer {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    color: white;
}

.role-no-access {
    background: linear-gradient(135deg, #e9ecef 0%, #ced4da 100%);
    color: #495057;
}

.task-dates {
    text-align: right;
    font-size: 0.8rem;
    color: #666;
}

.task-date {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-content: flex-end;
    margin-bottom: 0.25rem;
}

.task-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(67, 206, 162, 0.15);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.view-btn {
    background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
    color: white;
}

.view-btn:hover {
    background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
    transform: translateY(-1px);
}

.comments-btn {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    color: #666;
    border: 1px solid rgba(67, 206, 162, 0.2);
}

.comments-btn:hover {
    background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
    color: white;
    transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
    .my-tasks-container {
        padding: 1rem;
    }

    .page-title {
        font-size: 2rem;
    }

    .summary-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .stat-card {
        padding: 0.75rem;
    }

    .stat-number {
        font-size: 1.5rem;
    }

    .stat-label {
        font-size: 0.8rem;
    }

    .filters {
        flex-direction: column;
    }

    .filter-select {
        min-width: 100%;
    }

    .task-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
    }

    .task-metadata {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }

    .task-dates {
        text-align: left;
    }

    .task-date {
        justify-content: flex-start;
    }

    .task-actions {
        flex-direction: column;
    }

    .action-btn {
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .summary-stats {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .stat-card {
        padding: 1rem;
    }

    .filters-section {
        padding: 1rem;
    }
}
</style>
