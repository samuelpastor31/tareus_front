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
    }
  },
  emits: ['card-dragstart', 'card-drop', 'task-drop', 'drag-enter', 'drag-leave', 'card-dragend'],
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
    }
  }
};
</script>

<template>
  <div 
    class="card-column"
    draggable="true"
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
      <div v-if="!card.Tasks || card.Tasks.length === 0" class="no-tasks-in-card">
        No tasks in this card
      </div>
      <slot></slot>
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
.no-tasks-in-card {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 1rem 0;
}
</style>
