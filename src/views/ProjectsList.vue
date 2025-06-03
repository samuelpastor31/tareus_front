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
  },
  methods: {
    ...mapActions(useDataStore, ["deleteProject", "editProject", "fetchProjects", "createProject"]), async deleteProjects(project) {
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

    <div id="list">
      <project-item v-for="project in projects" :key="project.id" :project="project">
        <div id="buttons">
          <button class="editButton" :data-id="project.id" @click.stop="editProject(project)">
            <span class="material-icons">edit</span>
          </button>
          <button class="removeButton" :data-id="project.id" @click.stop="deleteProjects(project)">
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
</style>
