<script>
import { useDataStore } from "../stores/index.js";
import { mapActions, mapState } from "pinia";
import TaskItem from "../components/TaskItem.vue";
import CardItem from "../components/CardItem.vue";

export default {
  name: "ProjectTasksView",
  components: { TaskItem, CardItem },
  data() {
    return {
      projectId: null,
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
      tasksList: [],
      cardsList: [],
      dragOverCardId: null,
      dragOverUnassigned: false,
      isProcessingDrop: false,
    };
  },
  computed: {
    ...mapState(useDataStore, ["tasks", "projects", "cards"]),
    project() {
      return this.projects.find((p) => p.id === Number(this.projectId));
    },
  },
  methods: {
    ...mapActions(useDataStore, [
      "fetchTasks", 
      "createTask", 
      "fetchCards", 
      "createCard", 
      "updateCard", 
      "updateTaskCard"
    ]),
    async loadTasks() {
      this.loading = true;
      this.error = "";
      this.noTasks = false;
      try {
        await this.fetchTasks(this.projectId);
        this.tasksList = Array.isArray(this.tasks) ? [...this.tasks] : [];
        this.noTasks = this.tasksList.length === 0;
      } catch (e) {
        this.error = "Error loading tasks";
      }
      this.loading = false;
    },
    async loadCards() {
      this.loadingCards = true;
      try {
        await this.fetchCards(this.projectId);
        this.cardsList = Array.isArray(this.cards) ? [...this.cards] : [];
        this.noCards = this.cardsList.length === 0;
      } catch (e) {
        this.error = "Error loading cards";
      }
      this.loadingCards = false;
    },
    onDragStart(task, idx, cardId = null, event) {
      this.draggingTask = { ...task, idx, sourceCardId: cardId };
      this.draggingCard = null; 
      
      if (event && event.target) {
        event.target.setAttribute('dragging', 'true');
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
    },
    onDrop(idx) {
      if (this.draggingTask && typeof this.draggingTask.idx === "number") {
        const from = this.draggingTask.idx;
        const to = idx;
        if (from !== to) {
          const updated = [...this.tasksList];
          const [moved] = updated.splice(from, 1);
          updated.splice(to, 0, moved);
          this.tasksList = updated;
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
        return;
      }
      
      this.isProcessingDrop = true;
      
      if (typeof this.draggingCard.idx === "number") {
        const from = this.draggingCard.idx;
        const to = idx;
        if (from !== to) {
          const updated = [...this.cardsList];
          const [moved] = updated.splice(from, 1);
          updated.splice(to, 0, moved);
          this.cardsList = updated;
          
          this.updateCardPositions()
            .then(() => {
              this.isProcessingDrop = false;
            })
            .catch(() => {
              this.isProcessingDrop = false;
            });
        } else {
          this.isProcessingDrop = false;
        }
      } else {
        this.isProcessingDrop = false;
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
      
      if (this.draggingTask.sourceCardId === cardId) {
        this.draggingTask = null;
        this.dragOverCardId = null;
        return;
      }
      
      this.isProcessingDrop = true;
      const taskId = this.draggingTask.id;
      
      this.updateTaskCard(taskId, cardId)
        .then(() => {
          return Promise.all([this.loadTasks(), this.loadCards()]);
        })
        .then(() => {
          this.isProcessingDrop = false;
        })
        .catch((error) => {
          this.error = "Error assigning task to card";
          this.isProcessingDrop = false;
        });
      
      this.draggingTask = null;
      this.dragOverCardId = null;
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
        event.target.removeAttribute('dragging');
      }
    },
    
    onTaskDropOnUnassigned(event) {
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
      
      if (!this.draggingTask.sourceCardId) {
        this.draggingTask = null;
        this.dragOverUnassigned = false;
        return;
      }
      
      this.isProcessingDrop = true;
      const taskId = this.draggingTask.id;
      
      this.updateTaskCard(taskId, null)
        .then(() => {
          return Promise.all([this.loadTasks(), this.loadCards()]);
        })
        .then(() => {
          this.isProcessingDrop = false;
        })
        .catch(() => {
          this.error = "Error unassigning task from card";
          this.isProcessingDrop = false;
        });
      
      this.draggingTask = null;
      this.dragOverUnassigned = false;
    },
    async updateCardPositions() {
      const updatePromises = [];
      for (let i = 0; i < this.cardsList.length; i++) {
        const card = this.cardsList[i];
        if (card.position !== i) {
          updatePromises.push(
            this.updateCard({
              ...card,
              position: i
            })
          );
        }
      }
      return Promise.all(updatePromises);
    },
    async addTask() {
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
        await this.loadTasks();
        this.noTasks = false;
      } catch (e) {
        this.error = "Error creating task";
      }
    },
    async addCard() {
      if (!this.newCardName.trim()) return;
      try {
        const position = this.cardsList.length; // New card position is at the end
        await this.createCard(this.projectId, {
          name: this.newCardName,
          description: this.newCardDescription || "",
          position: position
        });
        this.newCardName = "";
        this.newCardDescription = "";
        await this.loadCards();
        this.noCards = false;
      } catch (e) {
        this.error = "Error creating card";
      }
    },
    
    async assignTaskToCardHandler(taskId, cardId) {
      try {
        await this.updateTaskCard(taskId, cardId === "" ? null : cardId);
        await this.loadTasks();
        await this.loadCards();
      } catch (e) {
        this.error = "Error assigning task to card";
      }
    },
    
    async removeTaskFromCardHandler(taskId, cardId) {
      try {
        await this.updateTaskCard(taskId, null);
        await this.loadTasks();
        await this.loadCards();
      } catch (e) {
        this.error = "Error removing task from card";
      }
    },
  },
  async mounted() {
    this.projectId = this.$route.params.id;
    await this.loadTasks();
    await this.loadCards();
  },
};
</script>

<template>
  <div class="kanban-view">
    <h2 v-if="project">Project: {{ project.name }}</h2>
    
    <!-- Form to add tasks -->
    <form class="add-task-form" @submit.prevent="addTask">
      <h3>Add New Task</h3>
      <input v-model="newTaskTitle" type="text" placeholder="Task title" required />
      <input v-model="newTaskDesc" type="text" placeholder="Task description" required />
      <select v-model="newTaskPriority">
        <option value="">Priority (optional)</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select v-model="newTaskStatus">
        <option value="">Status (optional)</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      <button type="submit">Add Task</button>
    </form>
    
    <!-- Form to add cards -->
    <form class="add-card-form" @submit.prevent="addCard">
      <h3>Add New Card</h3>
      <input v-model="newCardName" type="text" placeholder="Card name" required />
      <input v-model="newCardDescription" type="text" placeholder="Card description (optional)" />
      <button type="submit">Add Card</button>
    </form>

    <div v-if="loading || loadingCards" class="loading-msg">Loading...</div>
    <div v-if="error" class="error-msg">{{ error }}</div>
    
    <!-- Cards section -->
    <div v-if="!loadingCards" class="cards-container">
      <div v-if="noCards" class="no-cards-msg">No cards yet for this project. Create your first card.</div>
      
      <div class="cards-row" v-else>
        <card-item 
          v-for="(card, idx) in cardsList" 
          :key="card.id"
          :card="card"
          :dragOverCardId="dragOverCardId"
          @card-dragstart="(card, event) => onCardDragStart(card, idx, event)"
          @card-drop="(card, event) => onCardDrop(idx, event)"
          @task-drop="onTaskDropOnCard"
          @drag-enter="onDragEnter"
          @drag-leave="onDragLeave"
        >
          <task-item
            v-for="(task, taskIdx) in card.Tasks"
            :key="task.id"
            :task="task"
            class="task-in-card"
            draggable="true"
            @dragstart="(e) => onDragStart(task, taskIdx, card.id, e)"
            @dragend="onDragEnd"
          >
            <button @click="removeTaskFromCardHandler(task.id, card.id)" class="remove-from-card-btn">
              Remove from card
            </button>
          </task-item>
        </card-item>
      </div>
    </div>
    
    <!-- Unassigned tasks section -->
    <div class="unassigned-tasks-section">
      <h3>Unassigned Tasks</h3>
      <div v-if="loading" class="tasks-loading">Loading tasks...</div>
      <div v-else-if="noTasks" class="no-tasks-msg">No unassigned tasks yet for this project.</div>
      
      <div 
        class="unassigned-container"
        @dragover.prevent="allowDrop"
        @dragenter.prevent="onDragEnterUnassigned"
        @dragleave.prevent="onDragLeaveUnassigned"
        @drop.stop="onTaskDropOnUnassigned"
        :class="{ 'drag-over': dragOverUnassigned }"
      >
        <div class="tasks-row" v-if="!loading && !noTasks">
          <task-item
            v-for="(task, idx) in tasksList.filter(t => !t.card_id)"
            :key="task.id"
            :task="task"
            class="unassigned-task"
            draggable="true"
            @dragstart="(e) => onDragStart(task, idx, null, e)"
            @dragend="onDragEnd"
          >
            <div class="assign-to-card">
              <select @change="e => assignTaskToCardHandler(task.id, e.target.value)" class="card-select">
                <option value="">Assign to card</option>
                <option v-for="card in cardsList" :key="card.id" :value="card.id">{{ card.name }}</option>
              </select>
            </div>
          </task-item>
        </div>
      </div>
    </div>
    
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
.add-task-form,
.add-card-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  border: 1px solid #eee;
  padding: 1rem;
  border-radius: 8px;
  background: #f9f9f9;
  margin-top: 1.5rem;
}
.add-task-form h3,
.add-card-form h3 {
  width: 100%;
  text-align: center;
  margin-top: 0;
  color: #185a9d;
}
.add-task-form input[type="text"],
.add-card-form input[type="text"] {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #b2f7ef;
  font-size: 1rem;
  background: #fff;
}
.add-task-form select,
.card-select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #b2f7ef;
  font-size: 1rem;
  background: #fff;
}
.add-task-form button,
.add-card-form button {
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  background: #43cea2;
  color: #fff;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.add-task-form button:hover,
.add-card-form button:hover {
  background: #185a9d;
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
.unassigned-tasks-section {
  margin-top: 2rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
}
.unassigned-tasks-section h3 {
  margin-top: 0;
  color: #185a9d;
}
.unassigned-container {
  min-height: 100px;
  border-radius: 8px;
  padding: 0.5rem;
  transition: all 0.3s ease;
}
.unassigned-container.drag-over {
  background-color: rgba(67, 206, 162, 0.2);
  border: 2px dashed #43cea2;
  transform: scale(1.02);
}
.unassigned-task {
  margin-bottom: 0.8rem;
  cursor: grab;
}
.unassigned-task:active {
  cursor: grabbing;
}
.assign-to-card {
  margin-top: 0.5rem;
}
</style>
