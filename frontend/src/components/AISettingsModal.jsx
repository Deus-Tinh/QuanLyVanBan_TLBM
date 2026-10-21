import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  // Lắng nghe phím Escape để đóng modal thuận tiện
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={saving ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className="relative bg-surface border border-border-subtle rounded-2xl shadow-2xl w-[680px] max-w-full flex flex-col max-h-[92vh] my-auto overflow-hidden animate-in zoom-in-95 duration-150 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-elevated/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
              <i className="fa-solid fa-microchip" />
            </div>
            <div>
              <h3 className="text-base font-bold text-main m-0">
                Cấu hình Động cơ AI & API
              </h3>
              <p className="text-xs text-muted m-0 mt-0.5">
                Thiết lập nhà cung cấp LLM, khóa API và mô hình Vector Embedding
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg text-muted hover:text-main hover:bg-hover flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="Đóng (Esc)"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-primary" />
              <span className="text-sm font-medium">Đang tải cấu hình AI hiện tại...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Alert Feedback Banner */}
              {message && (
                <div
                  className={`rounded-xl p-3.5 flex items-start gap-3 text-xs leading-relaxed transition-all ${
                    message.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"
                  }`}
                  role="alert"
                >
                  <i
                    className={`fa-solid ${
                      message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"
                    } text-base shrink-0 mt-0.5`}
                  />
                  <div className="flex-1 font-medium">{message.text}</div>
                </div>
              )}

              {/* Engine Status Banner */}
              <div className="bg-surface-elevated/70 border border-border-subtle rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
                    Trạng thái Động cơ AI đang chạy
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        currentConfig?.provider === "openai"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {currentConfig?.provider || "Chưa cấu hình"}
                    </span>
                    <span className="text-xs text-main font-mono font-semibold bg-surface px-2.5 py-1 rounded-md border border-border-subtle">
                      Model: {currentConfig?.llm_model || "Mặc định"}
                    </span>
                  </div>
                </div>

                {currentConfig?.api_key_masked ? (
                  <div className="sm:text-right">
                    <span className="text-[11px] text-muted block mb-0.5">Khóa API hiện hành:</span>
                    <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-surface px-2.5 py-1 rounded-md border border-border-subtle inline-block">
                      {currentConfig.api_key_masked}
                    </code>
                  </div>
                ) : (
                  <div className="sm:text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                      <i className="fa-solid fa-triangle-exclamation text-[11px]" />
                      Chưa cấu hình API Key
                    </span>
                  </div>
                )}
              </div>

              {/* Step 1: Provider Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-secondary mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                    1
                  </span>
                  <span>Chọn Nhà cung cấp AI (Provider)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Google Gemini Card */}
                  <div
                    onClick={() => {
                      setProvider("gemini");
                      setLlmModel("gemini-3.8-flash");
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      provider === "gemini"
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                        : "border-border-subtle bg-surface hover:border-primary/40 hover:bg-hover/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                          <i className="fa-solid fa-wand-magic-sparkles" />
                        </span>
                        <div>
                          <strong className="text-main text-sm block">Google Gemini</strong>
                          <span className="inline-block bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Khuyên dùng
                          </span>
                        </div>
                      </div>
                      <div className="pt-0.5">
                        {provider === "gemini" ? (
                          <i className="fa-solid fa-circle-check text-primary text-base" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-border-subtle" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted leading-relaxed m-0">
                      Tốc độ cực nhanh, miễn phí từ Google AI Studio, trích xuất dữ liệu và văn bản chính xác cao.
                    </p>
                  </div>

                  {/* OpenAI Card */}
                  <div
                    onClick={() => {
                      setProvider("openai");
                      setLlmModel("gpt-4o-mini");
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      provider === "openai"
                        ? "border-emerald-500 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/20"
                        : "border-border-subtle bg-surface hover:border-emerald-500/40 hover:bg-hover/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                          <i className="fa-solid fa-robot" />
                        </span>
                        <div>
                          <strong className="text-main text-sm block">OpenAI</strong>
                          <span className="inline-block bg-secondary-subtle text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            GPT-4o / GPT-4o-mini
                          </span>
                        </div>
                      </div>
                      <div className="pt-0.5">
                        {provider === "openai" ? (
                          <i className="fa-solid fa-circle-check text-emerald-500 text-base" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-border-subtle" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted leading-relaxed m-0">
                      Dùng GPT-4o, GPT-4o-mini. Cần API key từ tài khoản OpenAI có số dư credits khả dụng.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: API Key & Model Configuration */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-secondary mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                    2
                  </span>
                  <span>Thiết lập Tham số &amp; Khóa API</span>
                </label>

                <div className="bg-surface-elevated/40 border border-border-subtle rounded-xl p-4 sm:p-5 space-y-4">
                  {/* API Key Field */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label
                        htmlFor="ai-api-key-input"
                        className="text-xs font-bold text-main flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-key text-primary text-xs" />
                        <span>{provider === "gemini" ? "Gemini API Key" : "OpenAI API Key"}</span>
                        <span className="text-danger">*</span>
                      </label>
                      <a
                        href={
                          provider === "gemini"
                            ? "https://aistudio.google.com/app/apikey"
                            : "https://platform.openai.com/api-keys"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline inline-flex items-center gap-1.5 transition-colors"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                        <span>
                          {provider === "gemini"
                            ? "Lấy key miễn phí tại Google AI Studio"
                            : "Lấy key tại OpenAI Platform"}
                        </span>
                      </a>
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-muted pointer-events-none flex items-center justify-center text-sm">
                        <i className="fa-solid fa-lock" />
                      </div>
                      <input
                        id="ai-api-key-input"
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={
                          currentConfig?.has_api_key
                            ? "•••••••••••••••••••• (Để trống nếu muốn giữ nguyên API Key hiện tại)"
                            : provider === "gemini"
                            ? "Dán Gemini API Key (AIzaSy...)"
                            : "Dán OpenAI API Key (sk-...)"
                        }
                        className="w-full text-sm bg-surface border border-border-subtle rounded-xl pl-10 pr-24 py-2.5 text-main font-mono placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 px-2.5 py-1 text-xs font-semibold rounded-lg text-secondary hover:text-main hover:bg-hover flex items-center gap-1.5 transition-colors cursor-pointer border border-border-subtle/70"
                        title={showKey ? "Ẩn khóa API" : "Hiện khóa API"}
                      >
                        <i className={`fa-solid ${showKey ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                        <span>{showKey ? "Ẩn" : "Hiện"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted mt-2">
                      <i className="fa-solid fa-shield-halved text-emerald-500 text-xs shrink-0" />
                      <span>
                        Khóa API được lưu cục bộ trên máy chủ của bạn và kiểm tra trực tiếp khi lưu.
                      </span>
                    </div>
                  </div>

                  {/* Models Configuration (LLM & Embedding) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-border-subtle/60">
                    {/* LLM Model Select */}
                    <div>
                      <label
                        htmlFor="ai-llm-select"
                        className="block text-xs font-semibold text-secondary mb-1.5 flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-microchip text-primary text-xs" />
                        <span>Mô hình LLM (Hỏi đáp &amp; Phân loại)</span>
                      </label>
                      <div className="relative">
                        <select
                          id="ai-llm-select"
                          value={llmModel}
                          onChange={(e) => setLlmModel(e.target.value)}
                          className="w-full text-sm bg-surface border border-border-subtle rounded-xl px-3.5 py-2.5 text-main appearance-none pr-9 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium shadow-2xs"
                        >
                          {provider === "gemini" ? (
                            <>
                              <option value="gemini-3.8-flash">
                                gemini-3.8-flash (Khuyên dùng - Nhanh &amp; Mới nhất)
                              </option>
                              <option value="gemini-3.6-flash">
                                gemini-3.6-flash (Cực kỳ ổn định)
                              </option>
                              <option value="gemini-3.5-flash-lite">
                                gemini-3.5-flash-lite (Siêu nhẹ &amp; Tiết kiệm)
                              </option>
                            </>
                          ) : (
                            <>
                              <option value="gpt-4o-mini">
                                gpt-4o-mini (Nhanh &amp; Tiết kiệm chi phí)
                              </option>
                              <option value="gpt-4o">gpt-4o (Thông minh cao cấp)</option>
                            </>
                          )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted text-xs">
                          <i className="fa-solid fa-chevron-down" />
                        </div>
                      </div>
                    </div>

                    {/* Embedding Model Box */}
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center gap-1.5">
                        <i className="fa-solid fa-network-wired text-indigo-500 text-xs" />
                        <span>Mô hình Vector Embedding</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={
                            provider === "gemini"
                              ? "models/gemini-embedding-001"
                              : "text-embedding-3-small"
                          }
                          className="w-full text-sm bg-hover/70 border border-border-subtle rounded-xl pl-3.5 pr-24 py-2.5 text-secondary font-mono cursor-not-allowed select-none shadow-2xs"
                        />
                        <span className="absolute right-2 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-surface border border-border-subtle text-muted flex items-center gap-1">
                          <i className="fa-solid fa-lock text-[9px]" />
                          <span>{provider === "gemini" ? "3072 dim" : "1536 dim"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-secondary hover:text-main hover:bg-hover border border-border-subtle transition-all cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                      <span>Đang kiểm tra &amp; Kích hoạt...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-circle-check text-sm" />
                      <span>Lưu &amp; Kích hoạt ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modalContent, window.document.body) : modalContent;
}
