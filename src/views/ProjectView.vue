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
      showAddTaskModal: false,
      selectedCardId: null,
      selectedCardName: '',
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
    <div v-if="loadingProject" class="loading-msg">Loading project details...</div>
    <h2 v-else-if="project">Project: {{ project.name }}</h2>
    <h2 v-else class="error-msg">Project not found</h2>

    <div v-if="loading || loadingCards" class="loading-msg">Loading...</div>
    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Cards section -->
    <div v-if="!loadingCards" class="cards-container">
      <div class="cards-row">
        <!-- Cards list -->
        <card-item v-for="(card, idx) in cardsList" :key="card.id" :card="card" :dragOverCardId="dragOverCardId"
          :canCreate="canCreate" :canEdit="canEdit" @card-dragstart="(card, event) => onCardDragStart(card, idx, event)"
          @card-drop="(card, event) => onCardDrop(idx, event)" @card-dragend="onDragEnd" @task-drop="onTaskDropOnCard"
          @drag-enter="onDragEnter" @drag-leave="onDragLeave" @add-task="handleAddTaskFromCard">
          
          <task-item
            v-for="(task, taskIdx) in card.Tasks" :key="task.id" :task="task" :can-edit="canEdit"
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

    <!-- Unassigned tasks section - only show if there are unassigned tasks -->
    <unassigned-tasks-section v-if="hasUnassignedTasks || loading" :tasks="tasksList" :cards="cardsList"
      :loading="loading" :noTasks="noTasks" :dragOverUnassigned="dragOverUnassigned"
      @drag-enter-unassigned="onDragEnterUnassigned" @drag-leave-unassigned="onDragLeaveUnassigned"
      @drop-on-unassigned="onTaskDropOnUnassigned" @drag-start="onDragStart" @drag-end="onDragEnd"
      @assign-to-card="assignTaskToCardHandler">
      <template #default="{ task, idx, cards }"> 
        <task-item :key="task.id" :task="task" :can-edit="canEdit"
          :project-users="projectUsers" class="unassigned-task" :draggable="canModifyTasksAndCards"
          @dragstart="(e) => onDragStart(task, idx, null, e)" @dragend="onDragEnd" @task-updated="handleTaskUpdate"
          @update-priority="handleUpdateTaskPriority" @update-status="handleUpdateTaskStatus"
          @update-assigned-user="handleUpdateTaskAssignedUser">
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
      <add-task-form v-if="canCreate" :isVisible="showAddTaskModal"
      :cardId="selectedCardId" :cardName="selectedCardName" :project-users="projectUsers" @add-task="handleAddTask"
      @close="closeAddTaskModal" />
  </div>
</template>

<style scoped>
.kanban-view {
  padding: 2rem 0.5rem;
  min-height: 100vh;
  box-sizing: border-box;
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
</style>
