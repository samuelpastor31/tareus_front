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
    },
    canViewProject() {
      const userId = Number(localStorage.getItem('user_id'));
      // Owner can always view
      if (userId && userId === this.project.owner_id) {
        return true;
      }
      // Check if user has view permission
      return this.project.ProjectUser?.can_view || false;
    }
  },
  methods: {
    goToProject() {
      // Only navigate if user has view permissions
      if (this.canViewProject) {
        this.$router.push(`/project/${this.project.id}/tasks`);
      } else {
        // Optionally show a message or do nothing
        console.warn('You do not have permission to view this project');
      }
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
  <div :class="[
    'card',
    canViewProject ? 'project-card-clickable' : 'project-card-disabled'
  ]" @click="canViewProject ? goToProject() : null">
    <div v-if="!canViewProject" class="no-access-overlay">
      <i class="material-icons">lock</i>
      <span>No access</span>
    </div>

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
        <li v-if="project.ProjectUser">Create: <strong>{{ project.ProjectUser?.can_create ? 'Yes' : 'No' }}</strong>
        </li>
      </ul>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  width: 320px;
  max-width: 320px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
}

.card:hover {
  background: #f8fffe;
  box-shadow: 0 8px 32px rgba(24, 90, 157, 0.15);
  transform: translateY(-2px);
  border-color: rgba(67, 206, 162, 0.3);
}

.project-card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.project-card-disabled::before {
  background: linear-gradient(90deg, #bbb 0%, #888 100%);
}

.project-card-disabled:hover {
  background: #f5f5f5;
  box-shadow: 0 4px 16px rgba(24, 90, 157, 0.08);
  transform: none;
  border-color: #e0e0e0;
}

.no-access-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #e74c3c;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #e74c3c;
  font-weight: 600;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
}

.no-access-overlay .material-icons {
  font-size: 2rem;
}

.title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #185a9d;
  letter-spacing: 0.5px;
}

.name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.description {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: #555;
  line-height: 1.5;
  flex-grow: 1;
}

.owner {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.owner-yes {
  color: #43cea2;
  font-weight: bold;
  font-size: 1.3em;
  text-shadow: 0 1px 2px rgba(67, 206, 162, 0.3);
}

.owner-no {
  color: #e74c3c;
  font-weight: bold;
  font-size: 1.3em;
  text-shadow: 0 1px 2px rgba(231, 76, 60, 0.3);
}

.permissions {
  background: linear-gradient(120deg, #f0faf9 0%, #f0f4f8 100%);
  border-radius: 8px;
  padding: 1rem;
  margin-top: auto;
  border: 1px solid rgba(67, 206, 162, 0.1);
}

.permissions>span {
  font-size: 0.9rem;
  font-weight: 600;
  color: #185a9d;
  display: block;
  margin-bottom: 0.5rem;
}

.permissions ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.permissions li {
  font-size: 0.85rem;
  color: #555;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.permissions strong {
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.permissions li:has(strong:contains("Yes")) strong {
  background: rgba(67, 206, 162, 0.1);
  color: #43cea2;
}

.permissions li:has(strong:contains("No")) strong {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

@media (max-width: 768px) {
  .card {
    width: 300px;
    max-width: 300px;
    min-height: 260px;
  }
}

@media (max-width: 480px) {
  .card {
    width: 100%;
    max-width: 100%;
    min-height: 240px;
    margin: 0 0.5rem;
  }
}
</style>