<script>
export default {
  props: {
    project: {
      type: Object,
      required: true,
    },
  },
  name: 'ProjectItem',
};
</script>

<template>
  <div class="card">
    <h3 class="title">Project: ({{ project.id }})</h3>
    <h4 class="name">Name: {{ project.name }}</h4>
    <p class="description">Description: {{ project.description }}</p>
    <p class="owner">Owner ID: {{ project.owner_id }}</p>
    <slot></slot>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.name {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.description {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
.owner {
  font-size: 0.8rem;
  color: #555;
}
</style>