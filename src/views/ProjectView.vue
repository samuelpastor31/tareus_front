<script>
import { useDataStore } from "../stores/index.js";
import { mapActions, mapState } from "pinia";
import TaskItem from "../components/TaskItem.vue";
import CardItem from "../components/CardItem.vue";
import TrashItem from "../components/TrashItem.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import AddCardForm from "../components/AddCardForm.vue";
import AddTaskForm from "../components/AddTaskForm.vue";
import UnassignedTasksSection from "../components/UnassignedTasksSection.vue";

export default {
  name: "ProjectView",
  components: {
    TaskItem,
    CardItem,
    TrashItem,
    ConfirmModal,
    AddCardForm,
    AddTaskForm,
    UnassignedTasksSection,
  },
  data() {
    return {
      projectId: null,
      projectUsers: [],
      draggingTask: null,
      draggingCard: null,
      newTaskTitle: "",
      newTaskDesc: "",
      newTaskPriority: "",
      newTaskStatus: "",
      newCardName: "",
      newCardDescription: "",
      error: "",
      loading: false,
      loadingCards: false,
      noTasks: false,
      noCards: false,
      dragOverCardId: null,
      dragOverUnassigned: false,
      isProcessingDrop: false,
      isAddingCard: false,
      loadingProject: false,
      showTrashZone: false,
      trashZoneActive: false,
      showConfirmModal: false,
      itemToDelete: null,
      deleteType: null, // 'task' or 'card'
      // Modal state for AddTaskForm
      selectedCardId: null,
      selectedCardName: '',
      // Project details dropdown
      showProjectDetails: false,
    };
  },
  computed: {
    ...mapState(useDataStore, ["tasks", "projects", "cards"]),
    project() {
      return this.projects.find((p) => p.id === Number(this.projectId));
    },
    canCreate() {
      return this.project?.ProjectUser?.can_create === true;
    },
    canEdit() {
      return this.project?.ProjectUser?.can_edit === true;
    },
    canModifyTasksAndCards() {
      return this.canCreate || this.canEdit;
    },
    hasUnassignedTasks() {
      return this.tasksList.some((task) => !task.card_id);
    },
    // Computed properties to sync with store
    tasksList() {
      return Array.isArray(this.tasks) ? [...this.tasks] : [];
    },
    cardsList() {
      return Array.isArray(this.cards) ? [...this.cards] : [];
    },
  },

  methods: {
    ...mapActions(useDataStore, [
      "fetchTasks",
      "createTask",
      "updateTask",
      "updateTaskPriority",
      "updateTaskStatus",
      "updateTaskAssignedUser",
      "fetchCards",
      "createCard",
      "updateCard",
      "updateTaskCard",
      "fetchProjects",
      "fetchProjectUsers",
      "deleteTask",
      "deleteCard",
      "reorderCards",
      "reorderTasks",
    ]),

    async loadProject() {
      this.loadingProject = true;
      try {
        // Get project from cached data (router guard should have ensured it exists)
        if (!this.project) {
          // If project is not in cache, try to refresh projects list
          await this.fetchProjects();

          if (!this.project) {
            console.warn(`Project with ID ${this.projectId} not found, redirecting to projects list`);
            this.$router.replace('/projects');
            return false;
          }
        }

        // Project exists in cache, no need to set currentProject as we use the computed property
        return true;
      } catch (e) {
        console.error("Error loading project:", e);
        this.error = "Error loading project details";
        return false;
      } finally {
        this.loadingProject = false;
      }
    },
    async loadTasks() {
      this.loading = true;
      this.error = "";
      this.noTasks = false;
      try {
        await this.fetchTasks(this.projectId);
        this.noTasks = this.tasksList.length === 0;
      } catch (e) {
        console.error("Error loading tasks:", e);
        if (e.response && e.response.status === 404) {
          console.warn(`Tasks for project ${this.projectId} not found, project may have been deleted`);
          this.$router.replace('/projects');
          return;
        }
        this.error = "Error loading tasks";
      }
      this.loading = false;
    },

    async loadCards() {
      this.loadingCards = true;
      try {
        await this.fetchCards(this.projectId);
        this.noCards = this.cardsList.length === 0;
      } catch (e) {
        console.error("Error loading cards:", e);
        if (e.response && e.response.status === 404) {
          console.warn(`Cards for project ${this.projectId} not found, project may have been deleted`);
          this.$router.replace('/projects');
          return;
        }
        this.error = "Error loading cards";
      }
      this.loadingCards = false;
    },
    async loadProjectUsers() {
      try {
        this.projectUsers = await this.fetchProjectUsers(this.projectId);

        // Check if project owner is in the users list, if not add them
        if (this.project && this.project.owner_id) {
          const ownerId = this.project.owner_id;
          const ownerInList = this.projectUsers.some(user => user.id === ownerId);

          if (!ownerInList) {
            // Get the owner information from the projects list
            const projects = this.projects || [];
            const currentProject = projects.find(p => p.id === parseInt(this.projectId));

            if (currentProject && currentProject.User) {
              // Add the owner to the users list with owner permissions
              const ownerUser = {
                id: ownerId,
                username: currentProject.User.username,
                email: currentProject.User.email,
                Projects: [{
                  ProjectUser: {
                    can_view: true,
                    can_edit: true,
                    can_create: true
                  }
                }],
                isOwner: true
              };
              this.projectUsers.unshift(ownerUser);
            }
          } else {
            // Mark existing owner in the list
            const ownerIndex = this.projectUsers.findIndex(user => user.id === ownerId);
            if (ownerIndex !== -1) {
              this.projectUsers[ownerIndex].isOwner = true;
            }
          }
        }
      } catch (e) {
        console.error("Error loading project users:", e);
        this.error = "Error loading project users";
      }
    },

    onDragStart(task, idx, cardId = null, event) {
      this.draggingTask = { ...task, idx, sourceCardId: cardId };
      this.draggingCard = null;
      this.showTrashZone = this.canCreate;

      if (event && event.target) {
        event.target.setAttribute("dragging", "true");
      }
    },

    onCardDragStart(card, idx, event) {
      if (this.draggingTask) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      this.draggingCard = { ...card, idx };
      this.draggingTask = null;
      this.showTrashZone = this.canCreate;
    },

    onDrop(idx) {
      if (this.draggingTask && typeof this.draggingTask.idx === "number") {
        const from = this.draggingTask.idx;
        const to = idx;
        if (from !== to) {
          this.reorderTasks(from, to);
        }
      }
      this.draggingTask = null;
    },

    onCardDrop(idx, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!this.draggingCard || this.draggingTask || this.isProcessingDrop) {
        this.resetDragState();
        return;
      }

      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to reorder cards";
        this.resetDragState();
        return;
      }

      this.isProcessingDrop = true;

      if (typeof this.draggingCard.idx === "number") {
        const from = this.draggingCard.idx;
        const to = idx;
        if (from !== to) {
          // Reorder cards in store
          this.reorderCards(from, to);

          this.updateCardPositions()
            .then(() => {
              this.resetDragState();
            })
            .catch(() => {
              this.resetDragState();
            });
        } else {
          this.resetDragState();
        }
      } else {
        this.resetDragState();
      }
      this.draggingCard = null;
    },

    onTaskDropOnCard(cardId, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (this.isProcessingDrop) {
        return;
      }

      if (!this.draggingTask) {
        return;
      }

      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to assign tasks to cards";
        this.resetDragState();
        return;
      }

      if (this.draggingTask.sourceCardId === cardId) {
        this.resetDragState();
        return;
      }

      this.isProcessingDrop = true;
      const taskId = this.draggingTask.id;

      this.updateTaskCard(taskId, cardId)
        .then(() => {
          this.resetDragState();
        })
        .catch((error) => {
          this.error = "Error assigning task to card";
          this.resetDragState();
        });
    },

    allowDrop(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return this.draggingTask ? true : false;
    },

    onDragEnter(cardId, event) {
      if (this.draggingTask) {
        if (this.draggingTask.sourceCardId !== cardId) {
          if (event) event.preventDefault();
          this.dragOverCardId = cardId;
          this.dragOverUnassigned = false;
        }
      }
    },

    onDragLeave(event) {
      if (event) event.preventDefault();
      this.dragOverCardId = null;
    },

    onDragEnterUnassigned(event) {
      if (!this.hasUnassignedTasks) return;

      if (this.draggingTask && this.draggingTask.sourceCardId) {
        if (event) event.preventDefault();
        this.dragOverUnassigned = true;
        this.dragOverCardId = null;
      }
    },

    onDragLeaveUnassigned(event) {
      if (event) event.preventDefault();
      this.dragOverUnassigned = false;
    },

    onDragEnd(event) {
      if (event && event.target) {
        event.target.removeAttribute("dragging");
      }
      setTimeout(() => {
        this.resetDragState();
      }, 100);
    },

    onDragEnterTrash(event) {
      event.preventDefault();
      this.trashZoneActive = true;
    },

    onDragLeaveTrash(event) {
      event.preventDefault();
      this.trashZoneActive = false;
    },

    onDropTrash(event) {
      event.preventDefault();

      if (!this.canCreate) {
        this.resetDragState();
        return;
      }

      if (this.draggingTask) {
        this.itemToDelete = this.draggingTask;
        this.deleteType = "task";
        this.showConfirmModal = true;
      } else if (this.draggingCard) {
        this.itemToDelete = this.draggingCard;
        this.deleteType = "card";
        this.showConfirmModal = true;
      }

      this.trashZoneActive = false;
    },

    confirmDelete() {
      if (!this.canCreate) {
        this.showConfirmModal = false;
        this.resetDragState();
        return;
      }

      if (this.deleteType === "task" && this.itemToDelete) {
        this.deleteTask(this.itemToDelete.id)
          .then(() => {
            this.resetDragState();
          })
          .catch(() => {
            this.error = "Error deleting task";
            this.resetDragState();
          });
      } else if (this.deleteType === "card" && this.itemToDelete) {
        this.deleteCard(this.itemToDelete.id)
          .then(() => {
            this.resetDragState();
          })
          .catch(() => {
            this.error = "Error deleting card";
            this.resetDragState();
          });
      }

      this.showConfirmModal = false;
      this.itemToDelete = null;
      this.deleteType = null;
    },

    cancelDelete() {
      this.showConfirmModal = false;
      this.itemToDelete = null;
      this.deleteType = null;
    },

    async updateCardPositions() {
      const updatePromises = [];
      for (let i = 0; i < this.cardsList.length; i++) {
        const card = this.cardsList[i];
        if (card.position !== i) {
          updatePromises.push(
            this.updateCard({
              ...card,
              position: i,
            })
          );
        }
      }
      return Promise.all(updatePromises);
    },

    async addTask() {
      if (!this.canCreate) {
        this.error = "You don't have permission to create tasks";
        return;
      }

      if (!this.newTaskTitle.trim() || !this.newTaskDesc.trim()) return;
      try {
        await this.createTask(this.projectId, {
          title: this.newTaskTitle,
          description: this.newTaskDesc,
          priority: this.newTaskPriority || undefined,
          status: this.newTaskStatus || undefined,
        });
        this.newTaskTitle = "";
        this.newTaskDesc = "";
        this.newTaskPriority = "";
        this.newTaskStatus = "";
        this.noTasks = false;
      } catch (e) {
        this.error = "Error creating task";
      }
    },

    async addCard() {
      if (!this.newCardName.trim()) return;
      try {
        const position = this.cardsList.length;
        await this.createCard(this.projectId, {
          name: this.newCardName,
          description: this.newCardDescription || "",
          position: position,
        });
        this.newCardName = "";
        this.newCardDescription = "";
        this.noCards = false;
        this.isAddingCard = false;
      } catch (e) {
        this.error = "Error creating card";
      }
    },

    showAddCardForm() {
      this.isAddingCard = true;
      this.$nextTick(() => {
        const input = document.getElementById("new-card-name");
        if (input) input.focus();
      });
    },

    cancelAddCard() {
      this.isAddingCard = false;
      this.newCardName = "";
      this.newCardDescription = "";
    },

    async assignTaskToCardHandler(taskId, cardId) {
      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to assign tasks to cards";
        return;
      }

      try {
        await this.updateTaskCard(taskId, cardId === "" ? null : cardId);
      } catch (e) {
        this.error = "Error assigning task to card";
      }
    },

    async removeTaskFromCardHandler(taskId, cardId) {
      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to remove tasks from cards";
        return;
      }

      try {
        await this.updateTaskCard(taskId, null);
      } catch (e) {
        this.error = "Error removing task from card";
      }
    },

    onTaskDropOnUnassigned(event) {
      if (!this.hasUnassignedTasks) {
        this.resetDragState();
        return;
      }

      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to modify tasks";
        this.resetDragState();
        return;
      }

      if (!this.draggingTask || this.isProcessingDrop) {
        return;
      }

      if (!this.draggingTask.sourceCardId) {
        this.resetDragState();
        return;
      }

      this.isProcessingDrop = true;
      const taskId = this.draggingTask.id;

      this.updateTaskCard(taskId, null)
        .then(() => {
          this.resetDragState();
        })
        .catch((error) => {
          this.error = "Error removing task from card";
          this.resetDragState();
        });
    },

    async handleTaskUpdate(updatedTask) {
      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to edit tasks";
        return;
      }

      try {
        await this.updateTask(updatedTask);
      } catch (error) {
        console.error('Error updating task:', error);
        this.error = "Error updating task";
      }
    },

    async handleUpdateTaskPriority(taskId, priority) {
      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to edit tasks";
        return;
      }

      try {
        await this.updateTaskPriority(taskId, priority);
      } catch (error) {
        console.error('Error updating task priority:', error);
        this.error = "Error updating task priority";
      }
    },

    async handleUpdateTaskStatus(taskId, status) {
      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to edit tasks";
        return;
      }

      try {
        await this.updateTaskStatus(taskId, status);
      } catch (error) {
        console.error('Error updating task status:', error);
        this.error = "Error updating task status";
      }
    },

    async handleUpdateTaskAssignedUser(taskId, assignedUserId) {
      if (!this.canModifyTasksAndCards) {
        this.error = "You don't have permission to edit tasks";
        return;
      }

      try {
        await this.updateTaskAssignedUser(taskId, assignedUserId);
      } catch (error) {
        console.error('Error updating task assigned user:', error);

        // Handle specific error for user permissions
        if (error.response?.data?.detail?.includes('can_view')) {
          this.error = "The selected user doesn't have the required permissions for this project";
        } else {
          this.error = "Error updating task assigned user";
        }
      }
    },

    resetDragState() {
      this.draggingTask = null;
      this.draggingCard = null;
      this.dragOverCardId = null;
      this.dragOverUnassigned = false;
      this.showTrashZone = false;
      this.trashZoneActive = false;
      this.isProcessingDrop = false;
    },

    // Modal methods
    handleAddTaskFromCard(cardId) {
      if (!this.canCreate) {
        this.error = "You don't have permission to create tasks";
        return;
      }

      const card = this.cardsList.find(c => c.id === cardId);
      if (card) {
        this.selectedCardId = cardId;
        this.selectedCardName = card.name;
        this.showAddTaskModal = true;
      }
    },

    closeAddTaskModal() {
      this.showAddTaskModal = false;
      this.selectedCardId = null;
      this.selectedCardName = '';
    },

    async handleAddTask(taskData) {
      if (!this.canCreate) {
        this.error = "You don't have permission to create tasks";
        return;
      }

      if (!taskData.title.trim() || !taskData.description.trim()) return;

      try {
        await this.createTask(this.projectId, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority || undefined,
          status: taskData.status || undefined,
          assigned_user_id: taskData.assigned_user_id || undefined,
          card_id: taskData.cardId || undefined,
        });

        this.closeAddTaskModal();
        this.noTasks = false;
      } catch (e) {
        console.error('Error creating task:', e);
        this.error = "Error creating task";
      }
    },

    // Project details methods
    toggleProjectDetails() {
      this.showProjectDetails = !this.showProjectDetails;
    }, formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    },

    getUserRole() {
      if (!this.project?.ProjectUser) return 'Member';

      const permissions = this.project.ProjectUser;
      if (permissions.can_create && permissions.can_edit) {
        return 'Admin';
      } else if (permissions.can_edit) {
        return 'Editor';
      } else if (permissions.can_view) {
        return 'Viewer';
      }
      return 'Member';
    },

    getRoleClass() {
      const role = this.getUserRole().toLowerCase();
      return `role-${role}`;
    },

    getProjectOwner() {
      if (!this.project?.User) return 'Unknown Owner';
      return this.project.User.username || this.project.User.email || 'Unknown Owner';
    },
    
    getMemberRole(member) {
      if (!member) return 'Member';

      // Check if this member is the project owner
      if (member.id === this.project?.owner_id || member.isOwner) {
        return 'Owner';
      }

      // The permissions are stored in the Projects[0].ProjectUser through association
      const permissions = member.Projects?.[0]?.ProjectUser;
      if (!permissions) return 'Member';

      // Admin is someone with all three permissions who is not the owner
      if (permissions.can_create && permissions.can_edit && permissions.can_view) {
        return 'Admin';
      } else if (permissions.can_edit) {
        return 'Editor';
      } else if (permissions.can_view) {
        return 'Viewer';
      }
      return 'Member';
    },

    getMemberRoleClass(member) {
      const role = this.getMemberRole(member).toLowerCase();
      return `role-${role}`;
    },
  },

  async mounted() {
    this.projectId = this.$route.params.id;

    // Load project first and only continue if it exists
    const projectLoaded = await this.loadProject();

    // Only load tasks and cards if project was successfully loaded
    if (projectLoaded) {
      await Promise.all([
        this.loadTasks(),
        this.loadCards(),
        this.loadProjectUsers()
      ]);
    }
  },
};
</script>

<template>
  <div class="kanban-view">
    <!-- Project Header -->
    <div class="project-header">
      <div v-if="loadingProject" class="loading-msg">Loading project details...</div>
      <div v-else-if="project" class="project-title-container">
        <div class="project-main-info">
          <h1 class="project-title">{{ project.name }}</h1>
          <p v-if="project.description" class="project-description">{{ project.description }}</p>
          <p v-else class="project-description-empty">No description provided</p>
        </div>
        <button @click="toggleProjectDetails" class="project-details-btn">
          <span class="btn-text">{{ showProjectDetails ? 'Hide Details' : 'Show Details' }}</span>
          <span class="btn-icon" :class="{ 'rotated': showProjectDetails }">▼</span>
        </button>
        <!-- Project Details Dropdown -->
        <div v-if="showProjectDetails" class="project-details-dropdown">
          <div class="project-detail-item">
            <span class="detail-label">Created:</span>
            <span class="detail-value">{{ formatDateTime(project.createdAt) }}</span>
          </div>
          <div class="project-detail-item">
            <span class="detail-label">Last Updated:</span>
            <span class="detail-value">{{ formatDateTime(project.updatedAt) }}</span>
          </div>
          <div class="project-detail-item">
            <span class="detail-label">Project Owner:</span>
            <span class="detail-value owner-info">
              <span class="owner-name">{{ getProjectOwner() }}</span>
              <span class="owner-badge">Owner</span>
            </span>
          </div>
          <div class="project-detail-item">
            <span class="detail-label">Your Role:</span>
            <span class="detail-value role-badge" :class="getRoleClass()">
              {{ getUserRole() }}
            </span>
          </div>
          <div class="project-detail-item">
            <span class="detail-label">Total Tasks:</span>
            <span class="detail-value">{{ tasksList.length }}</span>
          </div>
          <div class="project-detail-item">
            <span class="detail-label">Total Cards:</span>
            <span class="detail-value">{{ cardsList.length }}</span>
          </div>

          <!-- Project Members Section -->
          <div class="project-members-section">
            <div class="members-header">
              <span class="detail-label">Project Members ({{ projectUsers.length }})</span>
            </div>
            <div class="members-list">
              <div v-for="member in projectUsers" :key="member.id" class="member-item">
                <div class="member-info">
                  <span class="member-name">{{ member.username || 'Unknown User' }}</span>
                  <span class="member-email">{{ member.email }}</span>
                </div>
                <div class="member-permissions">
                  <span class="permission-badge" :class="getMemberRoleClass(member)">
                    {{ getMemberRole(member) }}
                  </span>
                </div>
              </div>
              <div v-if="projectUsers.length === 0" class="no-members">
                <span class="no-members-text">No members found</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h2 v-else class="error-msg">Project not found</h2>
    </div>

    <div v-if="loading || loadingCards" class="loading-msg">Loading...</div>
    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Empty project state -->
    <div v-if="!loading && !loadingCards && !error && noTasks && noCards" class="empty-project-state">
      <div class="empty-content">
        <div class="empty-icon">📋</div>
        <h3>Welcome to your new project!</h3>
        <p>This project is empty. Get started by creating your first task or organizing with cards.</p>
        <div class="empty-actions">
          <button v-if="canCreate" @click="showAddTaskModal = true" class="primary-action-btn">
            <span class="btn-icon">➕</span>
            Create Your First Task
          </button>
          <button v-if="canCreate" @click="showAddCardForm" class="secondary-action-btn">
            <span class="btn-icon">🗂️</span>
            Create a Card
          </button>
          <div v-if="!canCreate" class="no-permission-msg">
            <span class="permission-icon">🔒</span>
            <p>You don't have permission to create tasks or cards in this project.</p>
            <p>Contact the project owner to get started.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Cards section -->
    <div v-if="!loadingCards && !(noTasks && noCards)" class="cards-container">
      <div class="cards-row">
        <!-- Cards list -->
        <card-item v-for="(card, idx) in cardsList" :key="card.id" :card="card" :dragOverCardId="dragOverCardId"
          :canCreate="canCreate" :canEdit="canEdit" @card-dragstart="(card, event) => onCardDragStart(card, idx, event)"
          @card-drop="(card, event) => onCardDrop(idx, event)" @card-dragend="onDragEnd" @task-drop="onTaskDropOnCard"
          @drag-enter="onDragEnter" @drag-leave="onDragLeave" @add-task="handleAddTaskFromCard">

          <task-item v-for="(task, taskIdx) in card.Tasks" :key="task.id" :task="task" :can-edit="canEdit"
            :project-users="projectUsers" class="task-in-card" :draggable="canModifyTasksAndCards"
            @dragstart="(e) => onDragStart(task, taskIdx, card.id, e)" @dragend="onDragEnd"
            @task-updated="handleTaskUpdate" @update-priority="handleUpdateTaskPriority"
            @update-status="handleUpdateTaskStatus" @update-assigned-user="handleUpdateTaskAssignedUser">
            <button v-if="canModifyTasksAndCards" @click="removeTaskFromCardHandler(task.id, card.id)"
              class="remove-from-card-btn">
              Remove from card
            </button>
          </task-item>
        </card-item>

        <!-- Add Card Form Component -->
        <add-card-form v-if="canCreate" :is-adding="isAddingCard" @show-form="showAddCardForm" @cancel="cancelAddCard"
          @add-card="
            (cardData) => {
              newCardName = cardData.name;
              newCardDescription = cardData.description;
              addCard();
            }
          " />
      </div>
    </div>
    <!-- Unassigned tasks section - only show if there are unassigned tasks OR if there are tasks but no cards -->
    <unassigned-tasks-section
      v-if="(hasUnassignedTasks || (tasksList.length > 0 && cardsList.length === 0)) && !(noTasks && noCards)"
      :tasks="tasksList" :cards="cardsList" :loading="loading" :noTasks="noTasks"
      :dragOverUnassigned="dragOverUnassigned" @drag-enter-unassigned="onDragEnterUnassigned"
      @drag-leave-unassigned="onDragLeaveUnassigned" @drop-on-unassigned="onTaskDropOnUnassigned"
      @drag-start="onDragStart" @drag-end="onDragEnd" @assign-to-card="assignTaskToCardHandler">
      <template #default="{ task, idx, cards }">
        <task-item :key="task.id" :task="task" :can-edit="canEdit" :project-users="projectUsers" class="unassigned-task"
          :draggable="canModifyTasksAndCards" @dragstart="(e) => onDragStart(task, idx, null, e)" @dragend="onDragEnd"
          @task-updated="handleTaskUpdate" @update-priority="handleUpdateTaskPriority"
          @update-status="handleUpdateTaskStatus" @update-assigned-user="handleUpdateTaskAssignedUser">
          <div class="assign-to-card">
            <select @change="(e) => assignTaskToCardHandler(task.id, e.target.value)" class="card-select">
              <option value="">Assign to card</option>
              <option v-for="card in cards" :key="card.id" :value="card.id">{{ card.name }}</option>
            </select>
          </div>
        </task-item>
      </template>
    </unassigned-tasks-section>

    <!-- Trash zone for deleting items - only visible if user has creation permissions -->
    <trash-item :visible="showTrashZone && canCreate" :active="trashZoneActive" @drag-enter="onDragEnterTrash"
      @drag-leave="onDragLeaveTrash" @drop="onDropTrash" />

    <!-- Confirmation Modal -->
    <confirm-modal :visible="showConfirmModal" title="Confirm Deletion" :message="deleteType === 'task'
      ? `Are you sure you want to delete the task '${itemToDelete?.title}'?`
      : `Are you sure you want to delete the card '${itemToDelete?.name}'? All its tasks will also be deleted permanently.`
      " :confirmText="'Delete'" :cancelText="'Cancel'" :dangerMode="true" @confirm="confirmDelete"
      @cancel="cancelDelete" />
    <!-- Add Task Modal -->
    <add-task-form v-if="canCreate" :isVisible="showAddTaskModal" :cardId="selectedCardId" :cardName="selectedCardName"
      :project-users="projectUsers" @add-task="handleAddTask" @close="closeAddTaskModal" />
  </div>
</template>

<style scoped>
.kanban-view {
  padding: 2rem 0.5rem;
  min-height: 100vh;
  box-sizing: border-box;
}

.project-header {
  margin-bottom: 2rem;
}

.project-title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(24, 90, 157, 0.1);
  border: 1px solid rgba(67, 206, 162, 0.2);
  margin-bottom: 1rem;
  text-align: center;
  position: relative;
}

.project-main-info {
  width: 100%;
}

.project-title {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #185a9d 0%, #43cea2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  text-shadow: none;
}

.project-description {
  margin: 0;
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.project-description-empty {
  margin: 0;
  font-size: 1rem;
  color: #999;
  font-style: italic;
}

.project-details-btn {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #185a9d;
  border: 2px solid rgba(67, 206, 162, 0.3);
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.project-details-btn:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  border-color: rgba(67, 206, 162, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.2);
}

.btn-icon {
  transition: transform 0.3s ease;
  font-size: 0.8rem;
}

.btn-icon.rotated {
  transform: rotate(180deg);
}

.project-details-dropdown {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(248, 255, 254, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(67, 206, 162, 0.15);
  animation: fadeInDown 0.3s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.project-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(67, 206, 162, 0.1);
}

.project-detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #185a9d;
  font-size: 0.95rem;
}

.detail-value {
  color: #666;
  font-size: 0.95rem;
}

.role-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

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

.role-member {
  background: linear-gradient(135deg, #e9ecef 0%, #ced4da 100%);
  color: #495057;
}

.owner-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.owner-name {
  font-weight: 600;
}

.owner-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ff6b6b 0%, #e63946 100%);
  color: white;
}

.project-members-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid rgba(67, 206, 162, 0.2);
}

.members-header {
  margin-bottom: 0.8rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(67, 206, 162, 0.1);
  transition: all 0.2s ease;
}

.member-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(67, 206, 162, 0.2);
  transform: translateY(-1px);
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.member-name {
  font-weight: 600;
  color: #185a9d;
  font-size: 0.9rem;
}

.member-email {
  font-size: 0.8rem;
  color: #666;
}

.member-permissions {
  display: flex;
  align-items: center;
}

.permission-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-members {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-style: italic;
}

.no-members-text {
  font-size: 0.9rem;
}

.tasks-row {
  display: flex;
  flex-direction: row;
  gap: 1.2rem;
  justify-content: flex-start;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.loading-msg {
  color: #185a9d;
  text-align: center;
  margin: 1rem 0;
}

.tasks-loading {
  color: #185a9d;
  margin: 1rem 0;
}

.no-tasks-msg {
  color: #888;
  font-size: 1.1rem;
  margin: 1rem 0;
}

.no-cards-msg {
  text-align: center;
  color: #888;
  font-size: 1.1rem;
  margin: 2rem 0;
}

.error-msg {
  color: #d32f2f;
  text-align: center;
  margin: 1rem 0;
}

.empty-project-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.empty-content {
  text-align: center;
  max-width: 500px;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(24, 90, 157, 0.15);
  border: 1px solid rgba(67, 206, 162, 0.2);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.empty-content h3 {
  color: #185a9d;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.empty-content p {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.primary-action-btn {
  background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 16px rgba(67, 206, 162, 0.3);
  min-width: 200px;
  justify-content: center;
}

.primary-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(67, 206, 162, 0.4);
}

.secondary-action-btn {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #185a9d;
  border: 2px solid rgba(67, 206, 162, 0.3);
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 180px;
  justify-content: center;
}

.secondary-action-btn:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  border-color: rgba(67, 206, 162, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 206, 162, 0.2);
}

.no-permission-msg {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.3);
  margin-top: 1rem;
}

.permission-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.no-permission-msg p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: #856404;
}

.btn-icon {
  font-size: 1.2rem;
}

.card-select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #b2f7ef;
  font-size: 1rem;
  background: #fff;
}

.cards-container {
  margin-top: 2rem;
}

.cards-row {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  overflow-x: auto;
  padding: 1rem 0.5rem;
  min-height: 300px;
}

.task-in-card {
  margin-bottom: 0.8rem;
  position: relative;
  cursor: grab;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.task-in-card:last-child {
  margin-bottom: 0;
}

.task-in-card:active {
  cursor: grabbing;
}

.task-in-card[dragging="true"] {
  opacity: 0.6;
  border: 2px dashed #43cea2;
}

.remove-from-card-btn {
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.remove-from-card-btn:hover {
  background: #e63946;
}

.unassigned-task {
  margin-bottom: 0.8rem;
  cursor: grab;
  min-width: 280px;
  max-width: 340px;
  flex-shrink: 0;
}

.unassigned-task:active {
  cursor: grabbing;
}

.assign-to-card {
  margin-top: 0.5rem;
}

/* Responsive design for empty state */
@media (max-width: 768px) {
  .empty-project-state {
    min-height: 50vh;
    padding: 1rem;
  }

  .empty-content {
    padding: 2rem 1.5rem;
    max-width: 100%;
  }

  .empty-content h3 {
    font-size: 1.5rem;
  }

  .empty-content p {
    font-size: 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .primary-action-btn,
  .secondary-action-btn {
    width: 100%;
    min-width: auto;
  }

  .project-title-container {
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
  }

  .project-title {
    font-size: 2rem;
  }

  .project-description {
    font-size: 1rem;
  }

  .project-details-dropdown {
    padding: 0.8rem;
  }

  .project-detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
    padding: 0.7rem 0;
  }

  .detail-label,
  .detail-value {
    font-size: 0.9rem;
  }

  .member-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.8rem;
  }

  .member-info {
    width: 100%;
  }

  .member-permissions {
    width: 100%;
    justify-content: flex-start;
  }

  .owner-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .members-list {
    max-height: 150px;
  }
}
</style>
