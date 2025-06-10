<template>
    <div class="modal-overlay" v-if="show" @click="closeModal">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h3>Create a New Project</h3>
                <button class="close-btn" @click="closeModal">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <Form :validation-schema="validationSchema" @submit="handleCreateProject" :initial-values="formData">
                <div class="modal-body">
                    <!-- Project Information -->
                    <div class="form-section">
                        <h4 class="section-title">Project Information</h4>
                        <div class="form-group">
                            <label for="name">Project Name:</label>
                            <Field id="name" name="name" type="text" v-model="formData.name" class="form-input" />
                            <ErrorMessage name="name" class="error-message" />
                        </div>

                        <div class="form-group">
                            <label for="description">Description:</label>
                            <Field as="textarea" id="description" name="description" v-model="formData.description"
                                class="form-textarea" />
                            <ErrorMessage name="description" class="error-message" />
                        </div>
                    </div>

                    <!-- User Assignment Section -->
                    <div class="form-section">
                        <h4 class="section-title">Assign Users & Permissions</h4>

                        <!-- User Search -->
                        <div class="form-group">
                            <label for="userSearch">Search Users:</label>
                            <div class="search-container">
                                <input id="userSearch" type="text" v-model="userSearch"
                                    placeholder="Search by name or email..." class="form-input search-input"
                                    @input="filterUsers" />
                                <i class="bi bi-search search-icon"></i>
                            </div>
                        </div>

                        <!-- Available Users List -->
                        <div class="users-container" v-if="filteredUsers.length > 0">
                            <div class="users-list">
                                <div v-for="user in filteredUsers" :key="user.id" class="user-item"
                                    :class="{ 'selected': isUserSelected(user.id) }" @click="toggleUserSelection(user)">
                                    <div class="user-info">
                                        <div class="user-avatar">
                                            <i class="bi bi-person-circle"></i>
                                        </div>
                                        <div class="user-details">
                                            <span class="user-name">{{ user.name }}</span>
                                            <span class="user-email">{{ user.email }}</span>
                                        </div>
                                    </div>
                                    <div class="user-checkbox">
                                        <input type="checkbox" :checked="isUserSelected(user.id)"
                                            @change="toggleUserSelection(user)" />
                                    </div>
                                </div>
                            </div>
                        </div> <!-- Selected Users with Permissions -->
                        <div v-if="selectedUsers.length > 0" class="selected-users-section">
                            <h5 class="subsection-title">Selected Users & Permissions</h5>
                            <div class="selected-users-list">
                                <div v-for="user in selectedUsers" :key="user.id" class="selected-user-item">
                                    <div class="selected-user-info">
                                        <div class="user-avatar">
                                            <i class="bi bi-person-circle"></i>
                                        </div>
                                        <div class="user-details">
                                            <span class="user-name">{{ user.name }}</span>
                                            <span class="user-email">{{ user.email }}</span>
                                        </div>
                                    </div>
                                    <div class="permissions-container">
                                        <div class="permission-item">
                                            <label class="permission-label">
                                                <input type="checkbox" v-model="user.permissions.can_view"
                                                    class="permission-checkbox" :disabled="true"
                                                    @change="handlePermissionChange(user, 'can_view')" />
                                                <span class="permission-text">Read</span>
                                            </label>
                                        </div>
                                        <div class="permission-item">
                                            <label class="permission-label">
                                                <input type="checkbox" v-model="user.permissions.can_edit"
                                                    class="permission-checkbox"
                                                    @change="handlePermissionChange(user, 'can_edit')" />
                                                <span class="permission-text">Edit</span>
                                            </label>
                                        </div>
                                        <div class="permission-item">
                                            <label class="permission-label">
                                                <input type="checkbox" v-model="user.permissions.can_create"
                                                    class="permission-checkbox"
                                                    @change="handlePermissionChange(user, 'can_create')" />
                                                <span class="permission-text">Create</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button type="button" class="remove-user-btn" @click="removeUser(user.id)"
                                        title="Remove user">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Permission Presets -->
                        <div v-if="selectedUsers.length > 0" class="permission-presets">
                            <label class="preset-label">Quick assign permissions to all selected users:</label>
                            <div class="preset-buttons">
                                <button type="button" class="preset-btn viewer" @click="applyPreset('viewer')">
                                    <i class="bi bi-eye"></i> Reader
                                </button>
                                <button type="button" class="preset-btn editor" @click="applyPreset('editor')">
                                    <i class="bi bi-pencil"></i> Editor
                                </button>
                                <button type="button" class="preset-btn admin" @click="applyPreset('admin')">
                                    <i class="bi bi-plus-circle"></i> Creator
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn" :disabled="loading">
                        <span v-if="loading">
                            <i class="bi bi-arrow-clockwise spinning"></i> Creating...
                        </span>
                        <span v-else>Create Project</span>
                    </button>
                </div>
            </Form>
        </div>
    </div>
</template>

<script>
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";
import { useDataStore } from "../stores";

export default {
    name: "CreateProjectModal",
    components: {
        Form,
        Field,
        ErrorMessage,
    },
    props: {
        show: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['close', 'create'],
    data() {
        return {
            loading: false,
            userSearch: "",
            availableUsers: [],
            selectedUsers: [],
            filteredUsers: [],
            validationSchema: yup.object().shape({
                name: yup.string().required("Project name is required"),
                description: yup.string().required("Description is required"),
            }),
            formData: {
                name: "",
                description: "",
            },
        };
    },
    async mounted() {
        await this.loadUsers();
    },
    methods: {
        async loadUsers() {
            try {
                const store = useDataStore();
                this.availableUsers = await store.fetchUsers();
                this.filteredUsers = this.availableUsers;
            } catch (error) {
                console.error("Error loading users:", error);
            }
        }, filterUsers() {
            if (!this.userSearch.trim()) {
                this.filteredUsers = this.availableUsers;
                return;
            }

            const search = this.userSearch.toLowerCase();
            this.filteredUsers = this.availableUsers.filter(user => {
                const userName = user.name ? user.name.toLowerCase() : '';
                const userEmail = user.email ? user.email.toLowerCase() : '';
                return userName.includes(search) || userEmail.includes(search);
            });
        },

        isUserSelected(userId) {
            return this.selectedUsers.some(user => user.id === userId);
        }, toggleUserSelection(user) {
            const index = this.selectedUsers.findIndex(u => u.id === user.id);

            if (index > -1) {
                this.selectedUsers.splice(index, 1);
            } else {
                this.selectedUsers.push({
                    ...user,
                    permissions: {
                        can_view: true,
                        can_edit: false,
                        can_create: false
                    }
                });
            }
        }, handlePermissionChange(user, permission) {
            // Handle hierarchical permission logic - auto-select prerequisites
            if (permission === 'can_edit') {
                if (user.permissions.can_edit) {
                    // If enabling edit, auto-enable read (but view is always enabled anyway)
                    user.permissions.can_view = true;
                } else {
                    // If disabling edit, disable create
                    user.permissions.can_create = false;
                }
            } else if (permission === 'can_create') {
                if (user.permissions.can_create) {
                    // If enabling create, auto-enable read and edit
                    user.permissions.can_view = true;
                    user.permissions.can_edit = true;
                }
            }
        },

        removeUser(userId) {
            const index = this.selectedUsers.findIndex(user => user.id === userId);
            if (index > -1) {
                this.selectedUsers.splice(index, 1);
            }
        }, applyPreset(presetType) {
            const presets = {
                viewer: { can_view: true, can_edit: false, can_create: false },
                editor: { can_view: true, can_edit: true, can_create: false },
                admin: { can_view: true, can_edit: true, can_create: true }
            };

            const preset = presets[presetType];
            this.selectedUsers.forEach(user => {
                user.permissions = { ...preset };
            });
        },

        closeModal() {
            this.resetForm();
            this.$emit('close');
        },

        resetForm() {
            this.formData = {
                name: "",
                description: "",
            };
            this.selectedUsers = [];
            this.userSearch = "";
            this.filteredUsers = this.availableUsers;
            this.loading = false;
        },

        async handleCreateProject(values) {
            this.loading = true;

            try {
                const projectData = {
                    ...values,
                    users: this.selectedUsers.map(user => ({
                        userId: user.id,
                        permissions: user.permissions
                    }))
                };

                this.$emit('create', projectData);
                this.resetForm();
            } catch (error) {
                console.error("Error creating project:", error);
            } finally {
                this.loading = false;
            }
        },
    },
    watch: {
        show(newVal) {
            if (newVal) {
                // Prevent body scroll when modal is open
                document.body.style.overflow = 'hidden';
                // Load users when modal opens
                this.loadUsers();
            } else {
                // Restore body scroll when modal is closed
                document.body.style.overflow = '';
            }
        }
    },
    beforeUnmount() {
        // Ensure body scroll is restored when component is destroyed
        document.body.style.overflow = '';
    }
};
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css");

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: #fff;
    border-radius: 16px;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
    from {
        opacity: 0;
        transform: scale(0.8) translateY(-20px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem 1rem 2rem;
    border-bottom: 1px solid rgba(67, 206, 162, 0.2);
}

.modal-header h3 {
    color: #185a9d;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
}

.close-btn:hover {
    background: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
}

.modal-body {
    padding: 1.5rem 2rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #185a9d;
    font-weight: 600;
    font-size: 0.95rem;
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #b2f7ef;
    border-radius: 8px;
    font-size: 1rem;
    background: #f5f7fa;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border: 1.5px solid #43cea2;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(67, 206, 162, 0.1);
}

.form-textarea {
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
}

.error-message {
    color: #e74c3c;
    font-size: 0.85rem;
    margin-top: 0.25rem;
}

.modal-footer {
    display: flex;
    gap: 1rem;
    padding: 1rem 2rem 2rem 2rem;
    justify-content: flex-end;
    border-top: 1px solid rgba(67, 206, 162, 0.1);
}

.submit-btn {
    background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.8rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(67, 206, 162, 0.3);
}

.submit-btn:hover {
    background: linear-gradient(90deg, #185a9d 0%, #43cea2 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(67, 206, 162, 0.4);
}

.cancel-btn {
    background: #666;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.cancel-btn:hover {
    background: #555;
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .modal-content {
        width: 95%;
        margin: 1rem;
    }

    .modal-header,
    .modal-body,
    .modal-footer {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }

    .modal-footer {
        flex-direction: column;
    }

    .submit-btn,
    .cancel-btn {
        width: 100%;
    }

    .selected-user-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .permissions-container {
        width: 100%;
        justify-content: flex-start;
    }

    .preset-buttons {
        flex-direction: column;
        width: 100%;
    }

    .preset-btn {
        width: 100%;
    }
}

/* New styles for user management */
.form-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(67, 206, 162, 0.1);
}

.form-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.section-title {
    color: #185a9d;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(67, 206, 162, 0.3);
}

.subsection-title {
    color: #185a9d;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
}


.search-container {
    position: relative;
}

.search-input {
    padding-right: 2.5rem;
}

.search-icon {
    position: absolute;
    right: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
}

.users-container {
    margin-top: 1rem;
}

.users-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #b2f7ef;
    border-radius: 8px;
    background: #f5f7fa;
}

.user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem;
    border-bottom: 1px solid rgba(67, 206, 162, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
}

.user-item:last-child {
    border-bottom: none;
}

.user-item:hover {
    background: rgba(67, 206, 162, 0.1);
}

.user-item.selected {
    background: rgba(67, 206, 162, 0.2);
    border-left: 4px solid #43cea2;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.user-avatar {
    color: #185a9d;
    font-size: 1.5rem;
}

.user-details {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 600;
    color: #185a9d;
    font-size: 0.95rem;
}

.user-email {
    color: #666;
    font-size: 0.85rem;
}

.user-checkbox input[type="checkbox"] {
    transform: scale(1.2);
    accent-color: #43cea2;
}

.selected-users-section {
    margin-top: 1.5rem;
}

.selected-users-list {
    max-height: 300px;
    overflow-y: auto;
}

.selected-user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    margin-bottom: 0.8rem;
    border: 1px solid #43cea2;
    border-radius: 8px;
    background: rgba(67, 206, 162, 0.05);
    gap: 1rem;
}

.selected-user-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex: 1;
}

.permissions-container {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.permission-item {
    display: flex;
    align-items: center;
}

.permission-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    color: #185a9d;
    font-weight: 500;
    font-size: 0.9rem;
}

.permission-checkbox {
    transform: scale(1.1);
    accent-color: #43cea2;
}

.permission-text {
    user-select: none;
}

/* Disabled checkbox styles */
.permission-checkbox input[type="checkbox"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.permission-label:has(input[type="checkbox"]:disabled) {
    opacity: 0.7;
    cursor: not-allowed;
}

.remove-user-btn {
    background: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.remove-user-btn:hover {
    background: rgba(231, 76, 60, 0.2);
    transform: scale(1.1);
}

.permission-presets {
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(67, 206, 162, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(67, 206, 162, 0.2);
}

.preset-label {
    display: block;
    color: #185a9d;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
}

.preset-buttons {
    display: flex;
    gap: 0.8rem;
}

.preset-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    justify-content: center;
}

.preset-btn.viewer {
    background: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
}

.preset-btn.viewer:hover {
    background: #bbdefb;
}

.preset-btn.editor {
    background: #f3e5f5;
    color: #7b1fa2;
    border: 1px solid #e1bee7;
}

.preset-btn.editor:hover {
    background: #e1bee7;
}

.preset-btn.admin {
    background: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #a5d6a7;
}

.preset-btn.admin:hover {
    background: #a5d6a7;
}

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
