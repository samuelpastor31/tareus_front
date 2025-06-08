<script>
export default {
  name: 'CardItem',
  props: {
    card: {
      type: Object,
      required: true,
    },
    dragOverCardId: {
      type: [Number, String, null],
      default: null
    },    canCreate: {
      type: Boolean,
      default: false
    },
    canEdit: {
      type: Boolean,
      default: false
    }
  },
  emits: ['card-dragstart', 'card-drop', 'task-drop', 'drag-enter', 'drag-leave', 'card-dragend', 'add-task'],
  methods: {
    onCardDragStart(event) {
      this.$emit('card-dragstart', this.card, event);
    },
    onCardDrop(event) {
      this.$emit('card-drop', this.card, event);
    },
    onCardDragEnd(event) {
      this.$emit('card-dragend', event);
    },
    onTaskDropOnCard(event) {
      this.$emit('task-drop', this.card.id, event);
    },
    onDragEnter(event) {
      this.$emit('drag-enter', this.card.id, event);
    },
    onDragLeave(event) {
      this.$emit('drag-leave', event);
    },
    allowDrop(event) {
      event.preventDefault();
      event.stopPropagation();
    },
    openAddTaskModal() {
      this.$emit('add-task', this.card.id);
    }
  }
};
</script>

<template>
  <div 
    class="card-column"
    :draggable="canEdit"
    @dragstart.self="onCardDragStart"
    @dragend.self="onCardDragEnd"
    @dragover.prevent
    @drop="onCardDrop"
  >
    <div class="card-header">
      <h3>{{ card.name }}</h3>
      <p v-if="card.description">{{ card.description }}</p>
    </div>
  <div 
      class="card-tasks"
      :class="{ 'drag-over': dragOverCardId === card.id }"
      @dragover.prevent="allowDrop"
      @dragenter.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
      @drop.stop="onTaskDropOnCard"
      :data-card-id="card.id"
    >
      <div v-if="!card.Tasks || card.Tasks.length === 0" class="no-tasks-message">
        No tasks in this card yet
      </div>
      <slot></slot>
      
      <!-- Add Task Button -->
      <div v-if="canCreate" class="add-task-section">
        <button @click="openAddTaskModal" class="add-task-btn" title="Add task to this card">
          <span class="plus-icon">+</span>
          <span>Add task</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-column {
  background: #f0f4f8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  cursor: grab;
  border: 1px solid #e0e0e0;
  height: fit-content;
  max-height: 550px;
}
.card-column:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.card-header {
  padding: 1rem;
  background: #43cea2;
  color: white;
  border-radius: 8px 8px 0 0;
}
.card-header h3 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}
.card-header p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}
.card-tasks {
  padding: 1rem;
  flex-grow: 1;
  min-height: 150px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  transition: background-color 0.2s;
  width: 100%;
  box-sizing: border-box;
  /* Estilo para la barra de desplazamiento */
  scrollbar-width: thin;
  scrollbar-color: #43cea2 #f0f4f8;
}
.card-tasks::-webkit-scrollbar {
  width: 8px;
}
.card-tasks::-webkit-scrollbar-track {
  background: #f0f4f8;
  border-radius: 4px;
}
.card-tasks::-webkit-scrollbar-thumb {
  background-color: #43cea2;
  border-radius: 4px;
  border: 2px solid #f0f4f8;
}
.card-tasks.drag-over {
  background-color: rgba(67, 206, 162, 0.2);
  border: 2px dashed #43cea2;
  border-radius: 4px;
  transition: all 0.3s ease;
  transform: scale(1.02);
}
.no-tasks-message {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 1rem 0 0.5rem;
  font-size: 0.9rem;
}

.add-task-section {
  padding: 0.75rem 0;
  margin-top: 0.5rem;
  border-top: 1px solid rgba(67, 206, 162, 0.15);
}

.add-task-btn {
  width: 100%;
  background: linear-gradient(135deg, #43cea2 0%, #369870 100%);
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(67, 206, 162, 0.2);
}

.add-task-btn:hover {
  background: linear-gradient(135deg, #185a9d 0%, #14486d 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(67, 206, 162, 0.3);
}

.add-task-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(67, 206, 162, 0.2);
}

.plus-icon {
  font-size: 1rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
