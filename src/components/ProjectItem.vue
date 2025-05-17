<script>
export default {
  props: {
    project: {
      type: Object,
      required: true,
    },
  },
  name: 'ProjectItem',
  computed: {
    isOwner() {
      const userId = Number(localStorage.getItem('user_id'));
      return userId && userId === this.project.owner_id;
    }
  },
  methods: {
    goToProject() {
      this.$router.push(`/project/${this.project.id}/tasks`);
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d)) return "";
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }
};
</script>

<template>
  <div class="card project-card-clickable" @click="goToProject">
    <h3 class="title">Project: ({{ project.id }})</h3>
    <h4 class="name" v-if="project.name">Name: {{ project.name }}</h4>
    <p class="description" v-if="project.description">Description: {{ project.description }}</p>
    <p class="description" v-if="project.createdAt">Created at: {{ formatDate(project.createdAt) }}</p>
    <p class="description" v-if="project.updatedAt">Updated at: {{ formatDate(project.updatedAt) }}</p>
    <p class="owner" v-if="project.owner_id !== undefined">
      Owner:
      <span v-if="isOwner" class="owner-yes" title="You are the owner">&#10003;</span>
      <span v-else class="owner-no" title="You are not the owner">&#10007;</span>
    </p>
    <div class="permissions">
      <span>Permissions:</span>
      <ul>
        <li v-if="project.ProjectUser">View: <strong>{{ project.ProjectUser?.can_view ? 'Yes' : 'No' }}</strong></li>
        <li v-if="project.ProjectUser">Edit: <strong>{{ project.ProjectUser?.can_edit ? 'Yes' : 'No' }}</strong></li>
        <li v-if="project.ProjectUser">Create: <strong>{{ project.ProjectUser?.can_create ? 'Yes' : 'No' }}</strong></li>
      </ul>
    </div>
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
  cursor: pointer;
  transition: box-shadow 0.18s, background 0.18s;
}
.card:hover {
  background: #e0f7fa;
  box-shadow: 0 4px 16px rgba(24,90,157,0.12);
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
.permissions {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
.permissions ul {
  margin: 0.2rem 0 0 1rem;
  padding: 0;
  list-style: disc;
}
.owner-yes {
  color: #43cea2;
  font-weight: bold;
  margin-left: 0.3rem;
  font-size: 1.2em;
}
.owner-no {
  color: #d32f2f;
  font-weight: bold;
  margin-left: 0.3rem;
  font-size: 1.2em;
}
</style>