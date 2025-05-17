<script>
export default {
  name: 'UnassignedTasksSection',
  props: {
    tasks: {
      type: Array,
      required: true
    },
    cards: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    noTasks: {
      type: Boolean,
      default: false
    },
    dragOverUnassigned: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'drag-enter-unassigned', 
    'drag-leave-unassigned', 
    'drop-on-unassigned', 
    'drag-start',
    'drag-end',
    'assign-to-card'
  ],
  methods: {
    allowDrop(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return true;
    },
    onDragEnterUnassigned(event) {
      if (event) event.preventDefault();
      this.$emit('drag-enter-unassigned', event);
    },
    onDragLeaveUnassigned(event) {
      if (event) event.preventDefault();
      this.$emit('drag-leave-unassigned', event);
    },
    onTaskDropOnUnassigned(event) {
      if (event) event.preventDefault();
      this.$emit('drop-on-unassigned', event);
    },
    onDragStart(task, idx, event) {
      this.$emit('drag-start', task, idx, null, event);
    },
    onDragEnd(event) {
      this.$emit('drag-end', event);
    },
    assignTaskToCard(taskId, cardId) {
      this.$emit('assign-to-card', taskId, cardId);
    }
  }
};
</script>

<template>
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
        <slot
          v-for="(task, idx) in tasks.filter((t) => !t.card_id)"
          :key="task.id"
          :task="task"
          :idx="idx"
          :cards="cards"
        ></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
.tasks-loading {
  color: #185a9d;
  margin: 1rem 0;
}
.no-tasks-msg {
  color: #888;
  font-size: 1.1rem;
  margin: 1rem 0;
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
</style>
