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

                <div class="modal-footer">
                    <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Create Project</button>
                </div>
            </Form>
        </div>
    </div>
</template>

<script>
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";

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
    methods: {
        closeModal() {
            this.resetForm();
            this.$emit('close');
        },
        resetForm() {
            this.formData = {
                name: "",
                description: "",
            };
        },
        async handleCreateProject(values) {
            this.$emit('create', values);
            this.resetForm();
        },
    },
    watch: {
        show(newVal) {
            if (newVal) {
                // Prevent body scroll when modal is open
                document.body.style.overflow = 'hidden';
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
    max-width: 500px;
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
}
</style>
