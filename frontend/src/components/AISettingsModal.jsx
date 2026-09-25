import { useState, useEffect } from "react";
import { getAISettings, updateAISettings } from "../api";

export default function AISettingsModal({ onClose, onSaved }) {
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [llmModel, setLlmModel] = useState("gemini-3.8-flash");

  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const data = await getAISettings();
      setCurrentConfig(data);
      if (data.provider) setProvider(data.provider);
      if (data.llm_model) setLlmModel(data.llm_model);
    } catch (err) {
      console.error("Lỗi khi tải cấu hình:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      provider,
      api_key: apiKey.trim() || undefined,
      llm_model: llmModel.trim() || undefined,
    };

    try {
      const res = await updateAISettings(payload);
      setMessage({
        type: "success",
        text: res.message || "Đã lưu và kích hoạt cấu hình AI thành công!",
      });
      setApiKey("");
      await fetchSettings();
      if (onSaved) onSaved(res);
    } catch (err) {
      const errorDetail =
        err.response?.data?.detail ||
        err.message ||
        "Không thể lưu cấu hình. Vui lòng kiểm tra lại API Key.";
      setMessage({
        type: "danger",
        text: String(errorDetail),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1060,
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className="modal-header text-white p-4"
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center text-white"
                style={{
                  width: "44px",
                  height: "44px",
                  fontSize: "1.3rem",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)",
                }}
              >
                <i className="bi bi-cpu-fill"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">Cấu hình Động cơ AI & API</h5>
                <small className="text-white-50">
                  Tùy chỉnh mô hình LLM và Embedding để xử lý truy vấn RAG chính xác nhất
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={saving}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-3 text-secondary small fw-semibold">
                  Đang tải cấu hình hiện tại...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                {message && (
                  <div
                    className={`alert alert-${message.type} alert-dismissible fade show rounded-3 shadow-sm border-0`}
                    role="alert"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i
                        className={`bi ${
                          message.type === "success"
                            ? "bi-check-circle-fill text-success"
                            : "bi-exclamation-triangle-fill text-danger"
                        } fs-5`}
                      ></i>
                      <span className="small fw-semibold">{message.text}</span>
                    </div>
                  </div>
                )}

                {/* Status Bar */}
                <div className="card border-0 bg-white shadow-sm rounded-3 mb-4 p-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                      <small className="text-muted d-block mb-1">Engine AI đang kích hoạt:</small>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary text-uppercase px-2 py-1">
                          {currentConfig?.provider || "Chưa cấu hình"}
                        </span>
                        <span className="fw-bold text-dark small">
                          Model: {currentConfig?.llm_model || "Mặc định"}
                        </span>
                      </div>
                    </div>
                    {currentConfig?.api_key_masked && (
                      <div className="text-sm-end">
                        <small className="text-muted d-block mb-1">API Key hiện hành:</small>
                        <code className="text-success fw-bold bg-light px-2 py-1 rounded">
                          {currentConfig.api_key_masked}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small text-uppercase letter-spacing">
                    1. Chọn Nhà cung cấp AI (Provider):
                  </label>
                  <div className="row g-3">
                    {/* Google Gemini Card */}
                    <div className="col-md-6">
                      <div
                        className={`card h-100 p-3 rounded-3 border-2 transition ${
                          provider === "gemini"
                            ? "border-primary bg-white shadow-sm"
                            : "border-light-subtle bg-white"
                        }`}
                        style={{
                          cursor: "pointer",
                          transform: provider === "gemini" ? "scale(1.01)" : "none",
                        }}
                        onClick={() => {
                          setProvider("gemini");
                          setLlmModel("gemini-3.8-flash");
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="rounded-2 p-2 d-flex align-items-center justify-content-center text-white"
                              style={{ background: "linear-gradient(135deg, #2563eb, #38bdf8)" }}
                            >
                              <i className="bi bi-stars"></i>
                            </span>
                            <div>
                              <strong className="text-dark d-block">Google Gemini</strong>
                              <span className="badge bg-success-subtle text-success small">
                                Khuyên dùng
                              </span>
                            </div>
                          </div>
                          {provider === "gemini" && (
                            <i className="bi bi-check-circle-fill text-primary fs-5"></i>
                          )}
                        </div>
                        <small className="text-muted">
                          Tốc độ cực nhanh, miễn phí từ Google AI Studio, trích xuất dữ liệu và bảng biểu siêu nét.
                        </small>
                      </div>
                    </div>

                    {/* OpenAI Card */}
                    <div className="col-md-6">
                      <div
                        className={`card h-100 p-3 rounded-3 border-2 transition ${
                          provider === "openai"
                            ? "border-primary bg-white shadow-sm"
                            : "border-light-subtle bg-white"
                        }`}
                        style={{
                          cursor: "pointer",
                          transform: provider === "openai" ? "scale(1.01)" : "none",
                        }}
                        onClick={() => {
                          setProvider("openai");
                          setLlmModel("gpt-4o-mini");
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="rounded-2 p-2 d-flex align-items-center justify-content-center text-white"
                              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                            >
                              <i className="bi bi-robot"></i>
                            </span>
                            <div>
                              <strong className="text-dark d-block">OpenAI</strong>
                              <span className="badge bg-secondary-subtle text-secondary small">
                                GPT-4o / GPT-4o-mini
                              </span>
                            </div>
                          </div>
                          {provider === "openai" && (
                            <i className="bi bi-check-circle-fill text-primary fs-5"></i>
                          )}
                        </div>
                        <small className="text-muted">
                          Dùng GPT-4o, GPT-4o-mini. Cần API key từ tài khoản OpenAI có số dư credits.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gemini Config */}
                {provider === "gemini" && (
                  <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fw-bold text-dark small mb-0">
                          Gemini API Key:
                        </label>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="small text-decoration-none text-primary fw-semibold"
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i>
                          Lấy key miễn phí tại Google AI Studio
                        </a>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="bi bi-key-fill"></i>
                        </span>
                        <input
                          type={showKey ? "text" : "password"}
                          className="form-control border-start-0 border-end-0"
                          placeholder={
                            currentConfig?.has_api_key
                              ? "Để trống nếu muốn giữ nguyên API Key hiện tại"
                              : "Dán Gemini API Key (AIza...)"
                          }
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowKey(!showKey)}
                          title={showKey ? "Ẩn key" : "Hiện key"}
                        >
                          <i className={`bi ${showKey ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                      </div>
                      <div className="form-text small text-muted">
                        Khóa API được lưu cục bộ trên máy chủ của bạn và kiểm tra trực tiếp khi lưu.
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Mô hình LLM (Hỏi đáp & Phân loại):
                        </label>
                        <select
                          className="form-select form-select-sm rounded-3"
                          value={llmModel}
                          onChange={(e) => setLlmModel(e.target.value)}
                        >
                          <option value="gemini-3.8-flash">
                            gemini-3.8-flash (Khuyên dùng - Nhanh & Mới nhất)
                          </option>
                          <option value="gemini-3.6-flash">
                            gemini-3.6-flash (Cực kỳ ổn định)
                          </option>
                          <option value="gemini-3.5-flash-lite">
                            gemini-3.5-flash-lite (Siêu nhẹ & Tiết kiệm)
                          </option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Mô hình Vector Embedding:
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-light rounded-3"
                          value="models/gemini-embedding-001 (3072 dim)"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* OpenAI Config */}
                {provider === "openai" && (
                  <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fw-bold text-dark small mb-0">
                          OpenAI API Key:
                        </label>
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noreferrer"
                          className="small text-decoration-none text-primary fw-semibold"
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i>
                          Lấy key tại OpenAI Platform
                        </a>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="bi bi-key-fill"></i>
                        </span>
                        <input
                          type={showKey ? "text" : "password"}
                          className="form-control border-start-0 border-end-0"
                          placeholder={
                            currentConfig?.has_api_key
                              ? "Để trống nếu muốn giữ nguyên API Key hiện tại"
                              : "Dán OpenAI API Key (sk-...)"
                          }
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowKey(!showKey)}
                          title={showKey ? "Ẩn key" : "Hiện key"}
                        >
                          <i className={`bi ${showKey ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Mô hình LLM:
                        </label>
                        <select
                          className="form-select form-select-sm rounded-3"
                          value={llmModel}
                          onChange={(e) => setLlmModel(e.target.value)}
                        >
                          <option value="gpt-4o-mini">gpt-4o-mini (Nhanh & Tiết kiệm)</option>
                          <option value="gpt-4o">gpt-4o (Thông minh cao cấp)</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-secondary">
                          Mô hình Vector Embedding:
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-light rounded-3"
                          value="text-embedding-3-small"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-light px-4 rounded-3 border"
                    onClick={onClose}
                    disabled={saving}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-gradient px-4 rounded-3 d-inline-flex"
                    style={{ width: "auto" }}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Đang kiểm tra & Kích hoạt...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle"></i>
                        <span>Lưu & Kích hoạt ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
