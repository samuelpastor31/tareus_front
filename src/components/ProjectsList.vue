<script>
import { useDataStore } from '@/stores/index.js';
import ProjectItem from './ProjectItem.vue';
import { mapState, mapActions } from 'pinia';

export default {
  name: 'ProjectsList',
  components: {
    ProjectItem,
  },
  computed: {
    ...mapState(useDataStore, ['projects']),
  },
  methods: {
    ...mapActions(useDataStore, ['deleteProject', 'editProject']),
    deleteProjects(project) {
      if (confirm(`Do you want to delete the project with id ${project.id} and name ${project.name}?`)) {
        this.deleteProject(project.id);
      }
    },
    editProject(project) {
      this.$router.push({ path: `/edit/${project.id}` });
    },
  },
};
</script>

<template>
  <div id="list">
    <project-item
      v-for="project in projects"
      :key="project.id"
      :project="project"
    >
      <div id="buttons">
        <button class="editButton" :data-id="project.id" @click="editProject(project)">
          <span class="material-icons">edit</span>
        </button>
        <button class="removeButton" :data-id="project.id" @click="deleteProjects(project)">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </project-item>
  </div>
</template>

<style scoped>
#list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
#buttons {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}
button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
}
button:hover {
  background-color: #2980b9;
}
</style>