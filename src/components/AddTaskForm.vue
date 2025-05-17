<script>
export default {
  name: 'AddTaskForm',
  data() {
    return {
      title: '',
      description: '',
      priority: '',
      status: ''
    };
  },
  emits: ['add-task'],
  methods: {
    submitTask() {
      if (!this.title.trim() || !this.description.trim()) return;
      
      this.$emit('add-task', {
        title: this.title,
        description: this.description,
        priority: this.priority || undefined,
        status: this.status || undefined
      });
      
      // Reset form
      this.title = '';
      this.description = '';
      this.priority = '';
      this.status = '';
    }
  }
};
</script>

<template>
  <form class="add-task-form" @submit.prevent="submitTask">
    <h3>Add New Task</h3>
    <input v-model="title" type="text" placeholder="Task title" required />
    <input v-model="description" type="text" placeholder="Task description" required />
    <select v-model="priority">
      <option value="">Priority (optional)</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
    <select v-model="status">
      <option value="">Status (optional)</option>
      <option value="pending">Pending</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
    <button type="submit">Add Task</button>
  </form>
</template>

<style scoped>
.add-task-form {
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

.add-task-form h3 {
  width: 100%;
  text-align: center;
  margin-top: 0;
  color: #185a9d;
}

.add-task-form input[type="text"] {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #b2f7ef;
  font-size: 1rem;
  background: #fff;
}

.add-task-form select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #b2f7ef;
  font-size: 1rem;
  background: #fff;
}

.add-task-form button {
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  background: #43cea2;
  color: #fff;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}

.add-task-form button:hover {
  background: #185a9d;
}
</style>
