<script>
import { useDataStore } from "../stores/index.js";
import ProjectItem from "../components/ProjectItem.vue";
import CreateProjectModal from "../components/CreateProjectModal.vue";
import EditProjectModal from "../components/EditProjectModal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import { mapState, mapActions } from "pinia";

export default {
  name: "ProjectsList", components: {
    ProjectItem,
    CreateProjectModal,
    EditProjectModal,
    ConfirmModal,
  },
  data() {
    return {
      showCreateModal: false,
      showEditModal: false,
      selectedProject: null,
      // Search and filter properties
      searchQuery: '',
      showAdvancedFilters: false,
      filters: {
        onlyWithViewPermission: false,
        onlyWithEditPermission: false,
        onlyWithCreatePermission: false,
        onlyOwned: false,
      },
      // Confirm Modal
      showConfirmModal: false,
      confirmModal: {
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        dangerMode: true
      },
      confirmCallback: null,
      // Alert Modal
      showAlertModal: false,
      alertModal: {
        title: 'Error',
        message: '',
        dangerMode: true
      }
    };
  },
  computed: {
    ...mapState(useDataStore, ["projects"]),

    filteredProjects() {
      let filtered = [...this.projects];
      const userId = Number(localStorage.getItem('user_id'));

      // Filter by search query (name and description)
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(project => {
          const name = (project.name || '').toLowerCase();
          const description = (project.description || '').toLowerCase();
          return name.includes(query) || description.includes(query);
        });
      }

      // Filter by permissions
      if (this.filters.onlyWithViewPermission) {
        filtered = filtered.filter(project => {
          return userId === project.owner_id || project.ProjectUser?.can_view;
        });
      }

      if (this.filters.onlyWithEditPermission) {
        filtered = filtered.filter(project => {
          return userId === project.owner_id || project.ProjectUser?.can_edit;
        });
      }

      if (this.filters.onlyWithCreatePermission) {
        filtered = filtered.filter(project => {
          return userId === project.owner_id || project.ProjectUser?.can_create;
        });
      }

      if (this.filters.onlyOwned) {
        filtered = filtered.filter(project => {
          return userId === project.owner_id;
        });
      }

      return filtered;
    }
  },
  methods: {
    ...mapActions(useDataStore, ["deleteProject", "editProject", "fetchProjects", "createProject"]),

    // Permission checking methods
    canEditProject(project) {
      const userId = Number(localStorage.getItem('user_id'));
      // Only owner can edit
      return userId && userId === project.owner_id;
    },

    canDeleteProject(project) {
      const userId = Number(localStorage.getItem('user_id'));
      // Only owner can delete
      return userId && userId === project.owner_id;
    },

    async deleteProjects(project) {
      this.showConfirm(
        'Delete Project',
        `Do you want to delete the project "${project.name}"?`,
        async () => {
          try {
            const success = await this.deleteProject(project.id);
            if (success) {
              // Project deletion was successful, the store has already updated the projects array
            } else {
              this.showAlert('Error', 'Failed to delete project. Please try again.');
              // Refresh from server in case of failure
              await this.fetchProjects();
            }
          } catch (error) {
            console.error('Error deleting project:', error);
            this.showAlert('Error', 'An error occurred while deleting the project.');
            // Refresh from server in case of error
            await this.fetchProjects();
          }
        },
        'Delete',
        'Cancel',
        true
      );
    },
    editProject(project) {
      this.selectedProject = project;
      this.showEditModal = true;
    },
    openCreateModal() {
      this.showCreateModal = true;
    },
    closeCreateModal() {
      this.showCreateModal = false;
    },
    closeEditModal() {
      this.showEditModal = false;
      this.selectedProject = null;
    }, async handleCreateProject(values) {
      try {
        await this.createProject(values);
        await this.fetchProjects();
        this.closeCreateModal();
      } catch (error) {
        console.error("Error creating project:", error);
        this.showAlert('Error', 'An error occurred while creating the project.');
      }
    },

    async handleUpdateProject(values) {
      try {
        await this.fetchProjects(); // Refresh the projects list
        this.closeEditModal();
      } catch (error) {
        console.error("Error updating project:", error);
        this.showAlert('Error', 'An error occurred while updating the project.');
      }
    },

    // Helper methods for modals
    showAlert(title, message, dangerMode = true) {
      this.alertModal = { title, message, dangerMode };
      this.showAlertModal = true;
    },

    showConfirm(title, message, callback, confirmText = 'Confirm', cancelText = 'Cancel', dangerMode = true) {
      this.confirmModal = { title, message, confirmText, cancelText, dangerMode };
      this.confirmCallback = callback;
      this.showConfirmModal = true;
    },

    handleConfirm() {
      this.showConfirmModal = false;
      if (this.confirmCallback) {
        this.confirmCallback();
        this.confirmCallback = null;
      }
    },

    handleCancel() {
      this.showConfirmModal = false;
      this.confirmCallback = null;
    },

    handleAlertClose() {
      this.showAlertModal = false;
    },

    // Filter methods
    clearAllFilters() {
      this.searchQuery = '';
      this.filters = {
        onlyWithViewPermission: false,
        onlyWithEditPermission: false,
        onlyWithCreatePermission: false,
        onlyOwned: false,
      };
    },

    toggleAdvancedFilters() {
      this.showAdvancedFilters = !this.showAdvancedFilters;
    },

    hasActiveFilters() {
      return this.searchQuery.trim() ||
        this.filters.onlyWithViewPermission ||
        this.filters.onlyWithEditPermission ||
        this.filters.onlyWithCreatePermission ||
        this.filters.onlyOwned;
    },
  },
  mounted() {
    this.fetchProjects();
  },
};
</script>

<template>
  <div class="projects-container">
    <div class="projects-header">
      <h2>My Projects</h2>
      <button class="create-btn" @click="openCreateModal">
        <i class="bi bi-plus-circle"></i>
        Create New Project
      </button>
    </div>

    <!-- Search and Filter Section -->
    <div class="filter-section">
      <div class="search-bar">
        <div class="search-input-container">
          <i class="bi bi-search search-icon"></i> <input type="text" v-model="searchQuery"
            placeholder="Search projects by name or description..." class="search-input" />
          <button v-if="hasActiveFilters()" @click="clearAllFilters" class="clear-btn" title="Clear filters">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
        <button @click="toggleAdvancedFilters" class="filter-toggle-btn">
          <i class="bi bi-funnel"></i>
          Filters
          <i :class="['bi', showAdvancedFilters ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
      </div>


      <!-- Advanced Filters -->
      <transition name="filter-slide">
        <div v-if="showAdvancedFilters" class="advanced-filters">
          <h4>Filter by permissions</h4>
          <div class="filter-checkboxes">
            <label :class="['filter-checkbox', { active: filters.onlyOwned }]">
              <input type="checkbox" v-model="filters.onlyOwned">
              <span class="checkmark"></span>
              <span>Only projects I own (I am the owner)</span>
            </label>

            <label :class="['filter-checkbox', { active: filters.onlyWithViewPermission }]">
              <input type="checkbox" v-model="filters.onlyWithViewPermission">
              <span class="checkmark"></span>
              <span>Only projects I can view</span>
            </label>

            <label :class="['filter-checkbox', { active: filters.onlyWithEditPermission }]">
              <input type="checkbox" v-model="filters.onlyWithEditPermission">
              <span class="checkmark"></span>
              <span>Only projects I can edit</span>
            </label>

            <label :class="['filter-checkbox', { active: filters.onlyWithCreatePermission }]">
              <input type="checkbox" v-model="filters.onlyWithCreatePermission">
              <span class="checkmark"></span>
              <span>Only projects where I can create tasks</span>
            </label>
          </div>
        </div>
      </transition>
    </div>

    <!-- Results Summary -->
    <div class="results-summary" v-if="searchQuery || hasActiveFilters()">
      <span>Showing {{ filteredProjects.length }} of {{ projects.length }} projects</span>
    </div>

    <div id="list">
      <project-item v-for="project in filteredProjects" :key="project.id" :project="project">
        <div id="buttons" v-if="canEditProject(project) || canDeleteProject(project)">
          <button v-if="canEditProject(project)" class="editButton" :data-id="project.id"
            @click.stop="editProject(project)">
            <span class="material-icons">edit</span>
          </button>
          <button v-if="canDeleteProject(project)" class="removeButton" :data-id="project.id"
            @click.stop="deleteProjects(project)">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </project-item>
    </div>
    <CreateProjectModal :show="showCreateModal" @close="closeCreateModal" @create="handleCreateProject" />

    <!--Edit Project Modal -->
    <EditProjectModal :show="showEditModal" :project="selectedProject" @close="closeEditModal"
      @updated="handleUpdateProject" />

    <!-- Confirmation Modal -->
    <ConfirmModal :visible="showConfirmModal" :title="confirmModal.title" :message="confirmModal.message"
      :confirmText="confirmModal.confirmText" :cancelText="confirmModal.cancelText"
      :dangerMode="confirmModal.dangerMode" @confirm="handleConfirm" @cancel="handleCancel" />

    <!-- Alert Modal -->
    <ConfirmModal :visible="showAlertModal" :title="alertModal.title" :message="alertModal.message" :confirmText="'OK'"
      :cancelText="''" :dangerMode="alertModal.dangerMode" @confirm="handleAlertClose" @cancel="handleAlertClose" />
  </div>
</template>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css");

.projects-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(67, 206, 162, 0.2);
  width: 100%;
  flex-wrap: wrap;
  gap: 1rem;
}

.projects-header h2 {
  color: #185a9d;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
  min-width: 0;
}

.create-btn {
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.15);
  white-space: nowrap;
  flex-shrink: 0;
}

.create-btn:hover {
  background: linear-gradient(90deg, #185a9d 0%, #43cea2 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(24, 90, 157, 0.25);
}

#list {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-start;
}

#buttons {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.editButton,
.removeButton {
  background-color: #185a9d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.editButton:hover {
  background-color: #43cea2;
  transform: translateY(-1px);
}

.removeButton {
  background-color: #e74c3c;
}

.removeButton:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .projects-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .projects-header h2 {
    text-align: center;
  }
}

/* Filter Section Styles */
.filter-section {
  margin-bottom: 1.5rem;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(67, 206, 162, 0.2);
  width: 95%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.search-bar {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  margin-bottom: 0.8rem;
  width: 100%;
  flex-wrap: nowrap;
}

.search-input-container {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: calc(100% - 140px);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 1.1rem;
}

.search-input {
  width: 92%;
  padding: 0.7rem 1rem 0.7rem 3rem;
  border: 2px solid rgba(67, 206, 162, 0.3);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.search-input:focus {
  outline: none;
  border-color: #43cea2;
  background: white;
  box-shadow: 0 0 0 4px rgba(67, 206, 162, 0.1);
}

.clear-btn {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.filter-toggle-btn {
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%) !important;
  color: white !important;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  width: 130px;
  justify-content: center;
  opacity: 1 !important;
  visibility: visible !important;
  z-index: 10;
  position: relative;
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.2);
}

.filter-toggle-btn:hover {
  background: linear-gradient(90deg, #185a9d 0%, #43cea2 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 90, 157, 0.3);
}

.advanced-filters {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fffe 0%, #f0f8ff 100%);
  border-radius: 12px;
  border: 2px solid rgba(67, 206, 162, 0.3);
  margin-top: 1rem;
  box-shadow: 0 6px 20px rgba(24, 90, 157, 0.08);
  position: relative;
  overflow: hidden;
}

.advanced-filters::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
}

.advanced-filters h4 {
  margin: 0 0 1.5rem 0;
  color: #185a9d;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.advanced-filters h4::before {
  content: '🔍';
  font-size: 1.1rem;
}

.filter-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
  transition: all 0.3s ease;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: white;
  border: 1px solid rgba(67, 206, 162, 0.2);
  box-shadow: 0 2px 8px rgba(24, 90, 157, 0.05);
  position: relative;
  overflow: hidden;
}

.filter-checkbox::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #43cea2 0%, #185a9d 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.filter-checkbox:hover {
  color: #185a9d;
  background: rgba(67, 206, 162, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.12);
}

.filter-checkbox:hover::before {
  transform: scaleY(1);
}

.filter-checkbox input[type="checkbox"] {
  margin-right: 1rem;
  width: 20px;
  height: 20px;
  accent-color: #43cea2;
  cursor: pointer;
  border-radius: 4px;
  position: relative;
}

.filter-checkbox input[type="checkbox"]:checked {
  accent-color: #185a9d;
}

.filter-checkbox input[type="checkbox"]:checked+.checkmark {
  display: none;
}

.filter-checkbox .checkmark {
  display: none;
}

.filter-checkbox input[type="checkbox"]:checked~span {
  font-weight: 600;
  color: #185a9d;
}

.filter-checkbox.active {
  background: linear-gradient(135deg, rgba(67, 206, 162, 0.1) 0%, rgba(24, 90, 157, 0.1) 100%);
  border-color: #43cea2;
}

.filter-checkbox.active::before {
  transform: scaleY(1);
}

.results-summary {
  margin-bottom: 1rem;
  padding: 0.8rem 1.2rem;
  background: linear-gradient(90deg, rgba(67, 206, 162, 0.1) 0%, rgba(24, 90, 157, 0.1) 100%);
  border-radius: 8px;
  font-size: 0.95rem;
  color: #185a9d;
  font-weight: 600;
  border-left: 4px solid #43cea2;
}

/* Filter transition animation */
.filter-slide-enter-active {
  transition: all 0.4s ease-out;
}

.filter-slide-leave-active {
  transition: all 0.3s ease-in;
}

.filter-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
  max-height: 0;
}

.filter-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.filter-slide-enter-to,
.filter-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
}

/* Responsive Design for Filters */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .search-input-container {
    min-width: auto;
    /* Allow full width on mobile */
  }

  .filter-toggle-btn {
    width: 100%;
    justify-content: center;
  }

  .filter-checkboxes {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .filter-section {
    padding: 1rem;
  }

  .advanced-filters {
    padding: 1rem;
  }

  .advanced-filters h4 {
    font-size: 1.1rem;
  }

  .filter-checkbox {
    padding: 0.7rem;
    font-size: 0.9rem;
  }
}

/* Additional responsive breakpoint for medium screens */
@media (max-width: 992px) and (min-width: 769px) {
  .search-input-container {
    min-width: 180px;
    /* Adjusted for shorter container */
    max-width: calc(100% - 130px);
    /* Account for smaller button */
  }

  .filter-toggle-btn {
    min-width: 120px;
    /* Slightly smaller button */
    font-size: 0.9rem;
    padding: 0.7rem 1rem;
  }

  .filter-checkboxes {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .filter-checkbox {
    padding: 0.7rem 0.8rem;
  }
}
</style>
