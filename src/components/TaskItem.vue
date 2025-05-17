<script>
export default {
  name: 'TaskItem',
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
  methods: {
    formatStatus(status) {
      if (status === 'pending') return 'Pending';
      if (status === 'in_progress' || status === 'in-progress') return 'In Progress';
      if (status === 'completed') return 'Completed';
      return status || 'Pending';
    },
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }
};
</script>

<template>
  <div class="task-card">
    <div class="task-header">
      <span class="task-title">Title: {{ task.title }}</span>
      <span class="task-id">#ID: {{ task.id }}</span>
    </div>
    <div class="task-desc">Description: {{ task.description }}</div>
    <div class="task-info">
      <span class="task-status">
        <strong>Status:</strong>
        <span :class="'status-' + (task.status || 'pending')">
          {{ formatStatus(task.status) }}
        </span>
      </span>
      <span v-if="task.priority" class="task-priority">
        <strong>Priority:</strong>
        <span :class="'priority-' + task.priority">{{ capitalize(task.priority) }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(24,90,157,0.08);
  padding: 1rem 1.2rem;
  cursor: grab;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.18s;
  min-width: 220px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.task-card:active {
  cursor: grabbing;
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-title {
  font-weight: bold;
  color: #185a9d;
  font-size: 1.1rem;
}
.task-id {
  font-size: 0.92rem;
  color: #aaa;
}
.task-desc {
  font-size: 0.98rem;
  color: #555;
  margin-bottom: 0.2rem;
  margin-top: 0.2rem;
}
.task-info {
  display: flex;
  gap: 1.2rem;
  font-size: 0.92rem;
  color: #666;
  align-items: center;
}
.status-pending {
  color: #bfa600;
}
.status-in_progress,
.status-in-progress {
  color: #1e90ff;
}
.status-completed {
  color: #43cea2;
}
.priority-high {
  color: #d32f2f;
  font-weight: bold;
}
.priority-medium {
  color: #f9a825;
}
.priority-low {
  color: #388e3c;
}
</style>
