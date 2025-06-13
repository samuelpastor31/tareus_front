<script>
import { mapState, mapActions } from 'pinia';
import { useDataStore } from '../stores';

export default {
  name: 'Reports',
  data() {
    return {
      selectedProjectId: '',
      loading: false
    };
  },
  computed: {
    ...mapState(useDataStore, ['userReport', 'projectReport', 'projects']),
    
    ownedProjects() {
      const userId = Number(localStorage.getItem('user_id'));
      return this.projects.filter(project => project.owner_id === userId);
    },
    
    completionPercentage() {
      if (!this.userReport || this.userReport.totalAssignedTasks === 0) return 0;
      return Math.round((this.userReport.completedTasks / this.userReport.totalAssignedTasks) * 100);
    },
    
    projectCompletionPercentage() {
      if (!this.projectReport || this.projectReport.totalTasks === 0) return 0;
      return Math.round((this.projectReport.completedTasks / this.projectReport.totalTasks) * 100);
    }
  },
  methods: {
    ...mapActions(useDataStore, ['fetchUserReport', 'fetchProjectReport', 'fetchProjects']),
    
    async loadUserReport() {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        await this.fetchUserReport(Number(userId));
      }
    },
    
    async loadProjectReport() {
      if (this.selectedProjectId) {
        await this.fetchProjectReport(Number(this.selectedProjectId));
      }
    }
  },
  async mounted() {
    await this.fetchProjects();
    await this.loadUserReport();
  }
};
</script>

<template>
  <div class="reports-container">    <div class="reports-header">
      <h1>📊 Reports</h1>
      <p>View statistics for your projects and tasks</p>
    </div>

    <!-- User Report Section -->
    <div class="report-section">
      <h2>📝 My Personal Report</h2>
      <div class="report-card" v-if="userReport">        <div class="report-stat">
          <div class="stat-number">{{ userReport.totalAssignedTasks }}</div>
          <div class="stat-label">Assigned Tasks</div>
        </div>
        <div class="report-stat">
          <div class="stat-number">{{ userReport.completedTasks }}</div>
          <div class="stat-label">Completed Tasks</div>
        </div>
        <div class="report-stat">
          <div class="stat-number">{{ completionPercentage }}%</div>
          <div class="stat-label">Completion Percentage</div>
        </div>
      </div>
      <div v-else class="loading">Loading personal report...</div>
    </div>

    <!-- Projects Reports Section -->
    <div class="report-section">
      <h2>📂 Project Reports</h2>
      <div class="projects-selection">        <select v-model="selectedProjectId" @change="loadProjectReport" class="project-select">
          <option value="">Select a project</option>
          <option 
            v-for="project in ownedProjects" 
            :key="project.id" 
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </div>

      <div v-if="projectReport" class="report-card">        <div class="project-info">
          <h3>{{ projectReport.name }}</h3>
          <p>Project ID: {{ projectReport.projectId }}</p>
        </div>
        <div class="report-stats-grid">
          <div class="report-stat">
            <div class="stat-number">{{ projectReport.totalTasks }}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="report-stat">
            <div class="stat-number">{{ projectReport.completedTasks }}</div>
            <div class="stat-label">Completed Tasks</div>
          </div>
          <div class="report-stat">
            <div class="stat-number">{{ projectReport.highPriorityTasks }}</div>
            <div class="stat-label">High Priority Tasks</div>
          </div>
          <div class="report-stat">
            <div class="stat-number">{{ projectReport.assignedUsers }}</div>
            <div class="stat-label">Assigned Users</div>
          </div>
        </div>
        <div class="progress-section">
          <h4>Project Progress</h4>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: projectCompletionPercentage + '%' }"
            ></div>
          </div>          <p>{{ projectCompletionPercentage }}% completed</p>
        </div>
      </div>
      <div v-else-if="selectedProjectId" class="loading">Loading project report...</div>
      <div v-else class="empty-state">Select a project to view its report</div>
    </div>
  </div>
</template>


<style scoped>
.reports-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.reports-header {
  text-align: center;
  margin-bottom: 3rem;
}

.reports-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.reports-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.report-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.report-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.report-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 1rem;
}

.report-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.report-stat {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.project-info {
  margin-bottom: 2rem;
  text-align: center;
}

.project-info h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.projects-selection {
  margin-bottom: 1.5rem;
}

.project-select {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.progress-section {
  text-align: center;
}

.progress-section h4 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  transition: width 0.3s ease;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #95a5a6;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

@media (max-width: 768px) {
  .reports-container {
    padding: 1rem;
  }
  
  .report-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
}
</style>
