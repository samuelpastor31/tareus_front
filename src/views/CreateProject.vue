<template>
  <div id="form">
    <Form
      :validation-schema="validationSchema"
      @submit="handleSubmit"
      :initial-values="project"
    >
      <h3>Create a New Project</h3>

      <div>
        <label for="name">Project Name:</label>
        <Field id="name" name="name" type="text" v-model="project.name" />
        <ErrorMessage name="name" />
      </div>

      <div>
        <label for="description">Description:</label>
        <Field
          as="textarea"
          id="description"
          name="description"
          v-model="project.description"
        />
        <ErrorMessage name="description" />
      </div>

      <button type="submit">Create</button>
      <button type="reset">Reset</button>
    </Form>
  </div>
</template>

<script>
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";
import { mapActions } from "pinia";
import { useDataStore } from "../stores/index.js";

export default {
  name: "CreateProject",
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  data() {
    return {
      validationSchema: yup.object().shape({
        name: yup.string().required("Project name is required"),
        description: yup.string().required("Description is required"),
      }),
      project: {
        name: "",
        description: "",
      },
    };
  },
  methods: {
    ...mapActions(useDataStore, ["createProject"]),
    async handleSubmit(values) {
      try {
        await this.createProject(values);
        this.$router.push("/projects");
      } catch (error) {
        console.error("Error creating project:", error);
      }
    },
  },
};
</script>

<style scoped>
h3 {
  color: #2c3e50;
}
label {
  display: block;
  margin-top: 1rem;
  font-weight: bold;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}
button:hover {
  background-color: #2980b9;
}
</style>