import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10 phút cho các tác vụ nặng
});

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function uploadDocumentAsync(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Trả về ngay lập tức với job_id, không chờ indexing xong
  const response = await api.post("/upload/async", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000, // chỉ cần 30s để upload file
  });

  return response.data;
}

export async function getUploadProgress(jobId) {
  const response = await api.get(`/upload/progress/${jobId}`, {
    timeout: 10000,
  });
  return response.data;
}

export async function askQuestion(question, history = [], category = null) {
  const payload = { question, history };

  if (category) {
    payload.category = category;
  }

  const response = await api.post("/chat", payload);
  return response.data;
}

export async function getDocuments() {
  const response = await api.get("/documents");
  return response.data;
}

export async function getCategories() {
  const response = await api.get("/categories");
  return response.data;
}

export async function deleteDocuments() {
  const response = await api.delete("/documents");
  return response.data;
}

export async function deleteDocument(filename) {
  // URL encode the filename to handle special characters
  const encodedFilename = encodeURIComponent(filename);
  const response = await api.delete(`/documents/${encodedFilename}`);
  return response.data;
}

export async function reclassifyDocument(filename) {
  // URL encode the filename to handle special characters
  const encodedFilename = encodeURIComponent(filename);
  const response = await api.post(`/reclassify/${encodedFilename}`);
  return response.data;
}

export async function previewDocument(filename) {
  // URL encode the filename to handle special characters
  const encodedFilename = encodeURIComponent(filename);
  const response = await api.get(`/documents/${encodedFilename}/preview`);
  return response.data;
}

export async function getAISettings() {
  const response = await api.get("/settings/ai");
  return response.data;
}

export async function updateAISettings(settings) {
  const response = await api.post("/settings/ai", settings);
  return response.data;
}

