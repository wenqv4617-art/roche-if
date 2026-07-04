(function () {
  // 核心闭包设计，防止全局变量冲突
  let currentRoche = null;
  let pluginContainer = null;

  // 默认 SVG 图标库（现代简约，禁止 Emoji）
  const SVGS = {
    select: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    extend: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v12"/><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M6 15a6 6 0 0 1 6-6h6"/></svg>`,
    backend: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`,
    sync: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    arrowLeft: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    checkmark: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    send: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    generate: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`
  };

  // 插件状态定义
  let state = {
    activeTab: "select", 
    conversations: [], 
    activeIfLines: [], 
    endedIfLines: [],  

    // 交互辅助状态
    currentIfLineId: null, 
    selectedConvoIdForNew: null, 
    isGenerating: false, 
    isGeneratingSummary: false, 
    showingDetails: false, 

    // 双击操作状态
    activeMenuMessageIndex: null, 
    isEditingMessage: false,       

    newIfForm: {
      time: "当下",
      tone: "浪漫",
      extra: "",
      minWords: 300,
      maxWords: 600
    },

    detailsState: {
      sumFrom: 1,
      sumTo: 3,
      worldbooks: [] 
    },

    viewingEndedLineId: null
  };

  async function savePluginState() {
    if (!currentRoche) return;
    try {
      await currentRoche.storage.set("story_engine_data", {
        activeIfLines: state.activeIfLines,
        endedIfLines: state.endedIfLines,
        conversations: state.conversations 
      });
    } catch (e) {
      console.error("Failed to save Story Engine state:", e);
    }
  }

  async function loadPluginState() {
    if (!currentRoche) return;
    try {
      const data = await currentRoche.storage.get("story_engine_data");
      if (data) {
        state.activeIfLines = (data.activeIfLines || []).map(line => {
          line.summaries = line.summaries || [];
          line.minWords = line.minWords || 300;
          line.maxWords = line.maxWords || 600;
          return line;
        });
        state.endedIfLines = data.endedIfLines || [];
        state.conversations = data.conversations || [];
      }
    } catch (e) {
      console.error("Failed to load Story Engine state:", e);
    }
  }

  async function syncConversations() {
    if (!currentRoche) return;
    try {
      state.conversations = await currentRoche.conversation.list() || [];
      await savePluginState();
      render();
      currentRoche.ui.toast("对话同步成功");
    } catch (e) {
      console.error(e);
      currentRoche.ui.toast("同步对话失败，请检查权限");
    }
  }

  // UI 主渲染控制
  function render() {
    if (!pluginContainer) return;

    const showShell = !state.selectedConvoIdForNew && 
                      !(state.activeTab === "extend" && state.currentIfLineId) && 
                      !(state.activeTab === "backend" && state.viewingEndedLineId);

    const headerClass = state.isGenerating ? "se-header-loading" : "";
    const headerTitleText = state.isGenerating ? "对方回复中…" : "剧情引擎";

    let mainContentHtml = "";

    // 1. 选择页 (Select Tab)
    if (state.activeTab === "select") {
      if (state.selectedConvoIdForNew) {
        const convo = state.conversations.find(c => c.id === state.selectedConvoIdForNew);
        const name = convo ? (convo.title || convo.name || "未知对话") : "当前对话";
        mainContentHtml = `
          <div class="se-form-container">
            <div class="se-form-header">
              <button class="se-btn-icon" id="btn-cancel-form">${SVGS.arrowLeft}</button>
              <div class="se-form-title">初始化 IF 分支：${name}</div>
            </div>
            <div class="se-form-body">
              <div class="se-form-group">
                <label>时间线设定</label>
                <input type="text" id="form-time" value="${state.newIfForm.time}" placeholder="例如：当下 / 离开后的第三年 / 某个雨夜" />
              </div>
              <div class="se-form-group">
                <label>剧情基调</label>
                <select id="form-tone">
                  <option value="浪漫" ${state.newIfForm.tone === "浪漫" ? "selected" : ""}>浪漫</option>
                  <option value="酸涩" ${state.newIfForm.tone === "酸涩" ? "selected" : ""}>酸涩</option>
                  <option value="火辣" ${state.newIfForm.tone === "火辣" ? "selected" : ""}>火辣</option>
                </select>
              </div>
              
              <!-- 线下回复字数强约束区间配置 -->
              <div class="se-form-group">
                <label>线下回复字数区间 (强约束，不截断)</label>
                <div class="se-form-row">
                  <input type="number" id="form-min-words" value="${state.newIfForm.minWords}" placeholder="最小字数" style="flex: 1;" />
                  <span style="align-self: center; color: var(--se-text-muted);">至</span>
                  <input type="number" id="form-max-words" value="${state.newIfForm.maxWords}" placeholder="最大字数" style="flex: 1;" />
                </div>
              </div>

              <div class="se-form-group">
                <label>额外设定要求（高优先级）</label>
                <textarea id="form-extra" placeholder="选填，例如：我们在咖啡馆偶遇，两人都装作不认识彼此……" rows="4">${state.newIfForm.extra}</textarea>
              </div>
              <button class="se-btn-primary" id="btn-submit-engine" ${state.isGenerating ? "disabled" : ""}>
                ${state.isGenerating ? "引擎加载中…" : "启动引擎并开启 IF 线"}
              </button>
            </div>
          </div>
        `;
      } else {
        const listHtml = state.conversations.map(c => {
          const avatarHtml = c.avatar ? `<img src="${c.avatar}" class="se-convo-avatar" />` : `<div class="se-convo-avatar-placeholder"></div>`;
          const displayName = c.title || c.name || "未命名对话";
          return `
            <div class="se-convo-item" data-id="${c.id}">
              ${avatarHtml}
              <div class="se-convo-info">
                <div class="se-convo-name">${displayName}</div>
                <div class="se-convo-type">${c.isGroup ? "群聊" : "单聊"} • ID: ${c.id.substring(0, 8)}</div>
              </div>
            </div>
          `;
        }).join("");

        mainContentHtml = `
          <div class="se-panel">
            <div class="se-panel-header">
              <div class="se-panel-title">选择原始对话同步</div>
              <button class="se-btn-text" id="btn-sync-convo">${SVGS.sync} 同步当前进度</button>
            </div>
            <div class="se-panel-desc">请选择当前在 Roche 已经建立的主线对话，同步其角色、人设、记忆并在此处启动对应的平行 IF 剧情分支出线。</div>
            <div class="se-list-container">
              ${state.conversations.length === 0 ? `<div class="se-empty">暂无对话记录，请先点击右上角“同步当前进度”</div>` : listHtml}
            </div>
          </div>
        `;
      }
    }

    // 2. 续约页 (Extend Tab)
    else if (state.activeTab === "extend") {
      if (state.currentIfLineId) {
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (!currentIf) {
          state.currentIfLineId = null;
          render();
          return;
        }

        if (state.showingDetails) {
          const wbOptionsHtml = state.detailsState.worldbooks.map(wb => {
            const isChecked = currentIf.mountedWorldbooks && currentIf.mountedWorldbooks.includes(wb.id);
            return `
              <label class="se-checkbox-label">
                <input type="checkbox" class="wb-checkbox" value="${wb.id}" ${isChecked ? "checked" : ""} />
                <span>${wb.name || "未分类世界书"}</span>
              </label>
            `;
          }).join("");

          const summariesListHtml = (currentIf.summaries || []).map((sum, index) => {
            const isExpanded = sum.isExpanded;
            return `
              <div class="se-summary-item" data-id="${sum.id}">
                <div class="se-summary-item-header">
                  <div class="se-summary-item-title">#${index + 1} 总结（段落 ${sum.from} - ${sum.to}）</div>
                  <div class="se-summary-item-actions">
                    <button class="se-btn-text-sub btn-toggle-sum" data-id="${sum.id}">${isExpanded ? "收起" : "展开"}</button>
                    <button class="se-btn-text-sub btn-delete-sum" data-id="${sum.id}">${SVGS.trash}</button>
                  </div>
                </div>
                ${isExpanded ? `
                  <div class="se-summary-item-body">
                    <textarea class="se-summary-edit-area" data-id="${sum.id}">${sum.text}</textarea>
                    <button class="se-btn-primary se-btn-small btn-save-sum" data-id="${sum.id}">保存编辑</button>
                  </div>
                ` : `
                  <div class="se-summary-item-preview">${sum.text}</div>
                `}
              </div>
            `;
          }).join("");

          mainContentHtml = `
            <div class="se-form-container" style="position: relative;">
              <!-- 总结专用生成遮罩 -->
              ${state.isGeneratingSummary ? `
                <div class="se-overlay">
                  <div class="se-overlay-card">
                    <div class="se-spinner"></div>
                    <div>剧情深度提炼中...</div>
                  </div>
                </div>
              ` : ""}

              <div class="se-form-header">
                <button class="se-btn-icon" id="btn-close-details">${SVGS.arrowLeft}</button>
                <div class="se-form-title">IF线详情配置与总结</div>
              </div>
              <div class="se-form-body">
                <div class="se-section-title">挂载世界书 (多选)</div>
                <div class="se-wb-selector">
                  ${state.detailsState.worldbooks.length === 0 ? `<div class="se-empty-sub">没有可用的世界书</div>` : wbOptionsHtml}
                </div>

                <div class="se-divider"></div>

                <!-- 线下回复字数约束配置 -->
                <div class="se-section-title">线下故事续写字数控制</div>
                <div class="se-form-row">
                  <div class="se-form-group">
                    <label>最少生成字数</label>
                    <input type="number" id="detail-snapshot-time" value="${currentIf.snapshotMinWords || 300}" placeholder="默认 300" />
                  </div>
                  <div class="se-form-group">
                    <label>最多生成字数</label>
                    <input type="number" id="detail-max-words" value="${currentIf.snapshotMaxWords || 500}" placeholder="例如 500" />
                  </div>
                </div>

                <div class="se-divider"></div>

                <div class="se-section-title">跨段总结 (第 M 至 N 段)</div>
                <div class="se-form-row">
                  <div class="se-form-group">
                    <label>起始段序号</label>
                    <input type="number" id="sum-from" value="${state.detailsState.sumFrom}" min="1" max="${currentIf.messages.length}" />
                  </div>
                  <div class="se-form-group">
                    <label>结束段序号</label>
                    <input type="number" id="sum-to" value="${state.detailsState.sumTo}" min="1" max="${currentIf.messages.length}" />
                  </div>
                </div>
                <button class="se-btn-secondary" id="btn-gen-summary">生成选定区间总结</button>

                <div class="se-divider"></div>

                <div class="se-section-title">已生成的总结列表 (${currentIf.summaries ? currentIf.summaries.length : 0})</div>
                <div class="se-summaries-stack">
                  ${currentIf.summaries && currentIf.summaries.length > 0 ? summariesListHtml : `<div class="se-empty-sub">暂无提炼出的剧情总结，可在上方设定区间生成。</div>`}
                </div>

                <div class="se-divider"></div>

                <!-- 时空快照可视化展示 (严格依照4个字段排布) -->
                <div class="se-section-title">时空记忆快照 (时空锚点1)</div>
                <div class="se-panel-desc">创建此分支时冻结的主线上下文，用以防止主线剧情演进导致 OOC。</div>
                <div class="se-snapshot-visualizer">
                  <div class="se-snapshot-item-block">
                    <div class="se-snapshot-sub-title">char人设</div>
                    <div class="se-snapshot-sub-body">${currentIf.snapshot?.charPersona || "无冻结人设记录"}</div>
                  </div>
                  <div class="se-snapshot-item-block">
                    <div class="se-snapshot-sub-title">user人设</div>
                    <div class="se-snapshot-sub-body">${currentIf.snapshot?.userPersona || "无冻结特质记录"}</div>
                  </div>
                  <div class="se-snapshot-item-block">
                    <div class="se-snapshot-sub-title">核心记忆</div>
                    <div class="se-snapshot-sub-body">${currentIf.snapshot?.coreMemory || "无核心记忆总结"}</div>
                  </div>
                  <div class="se-snapshot-item-block">
                    <div class="se-snapshot-sub-title">事实记忆</div>
                    <div class="se-snapshot-sub-body">${(currentIf.snapshot?.factsList || "").replace(/\n/g, "<br>") || "无冻结事实记忆"}</div>
                  </div>
                </div>

                <div class="se-divider"></div>

                <!-- 删除此平行线和归档的排布 -->
                <div class="se-form-row">
                  <button class="se-btn-secondary" id="btn-delete-active-if" style="flex: 1; border-color: var(--se-danger); color: var(--se-danger);">删除此线</button>
                  <button class="se-btn-danger" id="btn-end-if" style="flex: 1;">结束并归档</button>
                </div>
              </div>
            </div>
          `;
        } else {
          const msgListHtml = currentIf.messages.map((m, idx) => {
            if (m.mode === "offline") {
              const isUser = m.role === "user";
              const label = isUser ? "你的行动/指令" : "剧情续写叙事";
              const blockClass = isUser ? "se-narrative-block-user" : "se-narrative-block";
              return `
                <div class="${blockClass} se-message-block" data-idx="${idx}">
                  <div class="se-narrative-meta">#${idx + 1} ${label} (双击操作)</div>
                  <div class="se-narrative-text">${m.text.replace(/\n/g, "<br>")}</div>
                </div>
              `;
            } else {
              const isUser = m.role === "user";
              const sideClass = isUser ? "se-bubble-right" : "se-bubble-left";
              const senderName = isUser ? "我" : currentIf.charName;
              return `
                <div class="se-bubble-wrapper ${sideClass} se-message-block" data-idx="${idx}">
                  <div class="se-bubble-sender">${senderName} <span class="se-bubble-num">#${idx + 1} (双击操作)</span></div>
                  <div class="se-bubble-box">${m.text.replace(/\n/g, "<br>")}</div>
                </div>
              `;
            }
          }).join("");

          const chatViewportClass = currentIf.mode === "online" ? "se-chat-messages se-chat-viewport-wechat" : "se-chat-messages";
          const middleTitle = state.isGenerating ? "对方回复中…" : `${currentIf.charName} (IF线)`;

          mainContentHtml = `
            <div class="se-chat-container" style="position: relative;">
              <!-- 消息操作高级浮动弹窗 -->
              ${state.activeMenuMessageIndex !== null ? `
                <div class="se-overlay">
                  <div class="se-overlay-card se-context-menu-card">
                    <div class="se-context-menu-title">消息 #${state.activeMenuMessageIndex + 1} 操作</div>
                    <div class="se-context-menu-preview">"${currentIf.messages[state.activeMenuMessageIndex]?.text.substring(0, 50)}..."</div>
                    
                    ${state.isEditingMessage ? `
                      <textarea class="se-summary-edit-area" id="edit-msg-text-area" rows="4">${currentIf.messages[state.activeMenuMessageIndex]?.text}</textarea>
                      <div class="se-context-menu-row">
                        <button class="se-btn-secondary" id="btn-cancel-edit-msg" style="flex: 1;">返回</button>
                        <button class="se-btn-primary" id="btn-save-edit-msg" style="flex: 1;">保存</button>
                      </div>
                    ` : `
                      <div class="se-context-menu-options">
                        <button class="se-btn-secondary btn-menu-action" id="btn-menu-edit">编辑消息</button>
                        <button class="se-btn-secondary btn-menu-action" id="btn-menu-rollback" style="color: var(--se-primary);">重回 (从此条回滚)</button>
                        <button class="se-btn-secondary btn-menu-action" id="btn-menu-delete" style="color: var(--se-danger);">删除消息</button>
                        <button class="se-btn-secondary btn-menu-action" id="btn-menu-cancel" style="margin-top: 8px;">取消</button>
                      </div>
                    `}
                  </div>
                </div>
              ` : ""}

              <div class="se-chat-header">
                <button class="se-btn-icon" id="btn-back-to-ifs">${SVGS.arrowLeft}</button>
                <div class="se-chat-title-wrapper">
                  <div class="se-chat-title">${middleTitle}</div>
                  <div class="se-chat-mode-toggle">
                    <button class="se-toggle-item ${currentIf.mode === "online" ? "active" : ""}" id="toggle-mode-online">线上模式</button>
                    <button class="se-toggle-item ${currentIf.mode === "offline" ? "active" : ""}" id="toggle-mode-offline">线下叙事</button>
                  </div>
                </div>
                <button class="se-btn-icon" id="btn-open-details">${SVGS.settings}</button>
              </div>
              
              <div class="${chatViewportClass}" id="chat-messages-scroll">
                ${msgListHtml}
              </div>

              <!-- 重构后的自适应输入框结构，按钮在右侧横排缩微呈现 -->
              <div class="se-chat-footer-reconstructed">
                <textarea id="chat-input" placeholder="${currentIf.mode === "online" ? "输入消息发送..." : "输入叙事段落指令..."}" rows="1"></textarea>
                <div class="se-chat-footer-buttons-aside">
                  <button class="se-btn-icon-aside" id="btn-send-msg" title="发送上屏">${SVGS.send}</button>
                  <button class="se-btn-icon-aside se-btn-primary-aside" id="btn-trigger-ai" title="AI推进/获取回复">${SVGS.generate}</button>
                </div>
              </div>
            </div>
          `;
        }
      } else {
        const activeIfsHtml = state.activeIfLines.map(item => {
          return `
            <div class="se-active-if-card" data-id="${item.id}">
              <div class="se-if-card-title">${item.charName} 平行宇宙</div>
              <div class="se-if-card-meta">
                <span>时间: ${item.time}</span>
                <span>基调: ${item.tone}</span>
                <span>长度: ${item.messages.length} 段</span>
              </div>
              <div class="se-if-card-desc">${item.messages[item.messages.length - 1]?.text.substring(0, 65)}...</div>
            </div>
          `;
        }).join("");

        mainContentHtml = `
          <div class="se-panel">
            <div class="se-panel-header">
              <div class="se-panel-title">进行中的 IF 分支出线</div>
            </div>
            <div class="se-panel-desc">您可以在下方继续任何一条已开启的平行剧情，在聊天与长文本故事体裁之间随心切换。</div>
            <div class="se-list-container">
              ${state.activeIfLines.length === 0 ? `<div class="se-empty">当前无进行中的 IF 剧情。请前往“选择”页开启。</div>` : activeIfsHtml}
            </div>
          </div>
        `;
      }
    }

    // 3. 渲染：后台页 (Backend Tab)
    else if (state.activeTab === "backend") {
      if (state.viewingEndedLineId) {
        const endedIf = state.endedIfLines.find(x => x.id === state.viewingEndedLineId);
        if (!endedIf) {
          state.viewingEndedLineId = null;
          render();
          return;
        }

        const logHtml = endedIf.messages.map((m, idx) => {
          const typeStr = m.mode === "online" ? "[线上]" : "[线下]";
          const roleStr = m.role === "user" ? "我" : endedIf.charName;
          return `
            <div class="se-log-item">
              <div class="se-log-meta">#${idx + 1} ${typeStr} ${roleStr}</div>
              <div class="se-log-text">${m.text.replace(/\n/g, "<br>")}</div>
            </div>
          `;
        }).join("");

        mainContentHtml = `
          <div class="se-form-container se-backend-log-view">
            <div class="se-form-header">
              <button class="se-btn-icon" id="btn-back-to-backend">${SVGS.arrowLeft}</button>
              <div class="se-form-title">查看已归档的 IF 线记录：${endedIf.charName}</div>
            </div>
            <div class="se-form-body se-log-body-stretch">
              <div class="se-form-row" style="gap: 8px;">
                <button class="se-btn-primary" id="btn-inject-main-mem" style="flex: 2;">生成总结并注入主记忆</button>
                <button class="se-btn-secondary" id="btn-delete-ended-if" style="flex: 1; border-color: var(--se-danger); color: var(--se-danger);">删除存档</button>
              </div>
              <div class="se-log-box">
                ${logHtml}
              </div>
            </div>
          </div>
        `;
      } else {
        const endedIfsHtml = state.endedIfLines.map(item => {
          return `
            <div class="se-ended-if-card" data-id="${item.id}">
              <div class="se-if-card-title">${item.charName} (已结案)</div>
              <div class="se-if-card-meta">
                <span>设定时间: ${item.time}</span>
                <span>基调: ${item.tone}</span>
              </div>
            </div>
          `;
        }).join("");

        mainContentHtml = `
          <div class="se-panel">
            <div class="se-panel-header">
              <div class="se-panel-title">后台归档与主记忆同步</div>
            </div>
            <div class="se-panel-desc">这里展示所有已结束的 IF 平行故事。您可以生成高度精炼的总结事实并一键永久注入宿主主记忆数据库中。</div>
            <div class="se-list-container">
              ${state.endedIfLines.length === 0 ? `<div class="se-empty">暂无已结束的 IF 剧情。</div>` : endedIfsHtml}
            </div>
          </div>
        `;
      }
    }

    let overlayText = "正在生成中...";
    if (state.activeTab === "select") overlayText = "平行时空引擎启动中...";
    if (state.activeTab === "extend") overlayText = "剧情深度续写中...";
    if (state.activeTab === "backend") overlayText = "正在总结并提炼主记忆...";

    if (showShell) {
      pluginContainer.innerHTML = `
        <div class="roche-plugin-story-engine">
          <div class="se-header ${headerClass}">
            <div class="se-header-indicator"></div>
            <div class="se-header-text">${headerTitleText}</div>
            <button class="se-btn-icon" id="btn-close-app">${SVGS.close}</button>
          </div>

          <div class="se-main" style="position: relative;">
            ${state.isGenerating ? `
              <div class="se-overlay">
                <div class="se-overlay-card">
                  <div class="se-spinner"></div>
                  <div>${overlayText}</div>
                </div>
              </div>
            ` : ""}
            ${mainContentHtml}
          </div>

          <div class="se-dock">
            <button class="se-dock-item ${state.activeTab === "select" ? "active" : ""}" id="dock-tab-select">
              ${SVGS.select}
              <span>选择</span>
            </button>
            <button class="se-dock-item ${state.activeTab === "extend" ? "active" : ""}" id="dock-tab-extend">
              ${SVGS.extend}
              <span>续约</span>
            </button>
            <button class="se-dock-item ${state.activeTab === "backend" ? "active" : ""}" id="dock-tab-backend">
              ${SVGS.backend}
              <span>后台</span>
            </button>
          </div>
        </div>
      `;
    } else {
      pluginContainer.innerHTML = `
        <div class="roche-plugin-story-engine">
          <div class="se-main se-main-full" style="position: relative;">
            ${state.isGenerating ? `
              <div class="se-overlay">
                <div class="se-overlay-card">
                  <div class="se-spinner"></div>
                  <div>${overlayText}</div>
                </div>
              </div>
            ` : ""}
            ${mainContentHtml}
          </div>
        </div>
      `;
    }

    bindAllEvents();

    const scrollBox = pluginContainer.querySelector("#chat-messages-scroll");
    if (scrollBox) {
      scrollBox.scrollTop = scrollBox.scrollHeight;
    }
  }

  async function fetchWorldbookText(wbIds) {
    if (!currentRoche || !wbIds || wbIds.length === 0) return "无挂载世界书词条。";
    try {
      let combined = "";
      for (const id of wbIds) {
        const entries = await currentRoche.worldbook.getEntries({ categoryId: id });
        if (entries && entries.length > 0) {
          entries.forEach(entry => {
            combined += `[词条: ${entry.key || entry.name}]\n${entry.text || entry.content || ""}\n`;
          });
        }
      }
      return combined || "无挂载世界书词条内容。";
    } catch (e) {
      console.error(e);
      return "获取世界书词条失败。";
    }
  }

  // 绑定事件处理器
  function bindAllEvents() {
    if (!pluginContainer || !currentRoche) return;

    // --- 框架外壳层 ---
    const btnCloseApp = pluginContainer.querySelector("#btn-close-app");
    if (btnCloseApp) {
      btnCloseApp.onclick = () => currentRoche.ui.closeApp();
    }

    const tabSelect = pluginContainer.querySelector("#dock-tab-select");
    if (tabSelect) {
      tabSelect.onclick = () => {
        if (state.isGenerating || state.isGeneratingSummary) return;
        state.activeTab = "select";
        state.selectedConvoIdForNew = null;
        render();
      };
    }
    const tabExtend = pluginContainer.querySelector("#dock-tab-extend");
    if (tabExtend) {
      tabExtend.onclick = () => {
        if (state.isGenerating || state.isGeneratingSummary) return;
        state.activeTab = "extend";
        state.showingDetails = false;
        render();
      };
    }
    const tabBackend = pluginContainer.querySelector("#dock-tab-backend");
    if (tabBackend) {
      tabBackend.onclick = () => {
        if (state.isGenerating || state.isGeneratingSummary) return;
        state.activeTab = "backend";
        state.viewingEndedLineId = null;
        render();
      };
    }

    // --- 1. 选择页事件 ---
    const btnSyncConvo = pluginContainer.querySelector("#btn-sync-convo");
    if (btnSyncConvo) {
      btnSyncConvo.onclick = () => syncConversations();
    }

    const convoItems = pluginContainer.querySelectorAll(".se-convo-item");
    convoItems.forEach(item => {
      item.onclick = () => {
        state.selectedConvoIdForNew = item.getAttribute("data-id");
        render();
      };
    });

    const btnCancelForm = pluginContainer.querySelector("#btn-cancel-form");
    if (btnCancelForm) {
      btnCancelForm.onclick = () => {
        state.selectedConvoIdForNew = null;
        render();
      };
    }

    const btnSubmitEngine = pluginContainer.querySelector("#btn-submit-engine");
    if (btnSubmitEngine) {
      btnSubmitEngine.onclick = async () => {
        const timeVal = pluginContainer.querySelector("#form-time").value.trim() || "当下";
        const toneVal = pluginContainer.querySelector("#form-tone").value;
        const extraVal = pluginContainer.querySelector("#form-extra").value.trim();
        const minWordsVal = parseInt(pluginContainer.querySelector("#form-min-words").value, 10) || 300;
        const maxWordsVal = parseInt(pluginContainer.querySelector("#form-max-words").value, 10) || 600;

        state.newIfForm = { time: timeVal, tone: toneVal, extra: extraVal, minWords: minWordsVal, maxWords: maxWordsVal };
        state.isGenerating = true;
        render();

        try {
          const convoId = state.selectedConvoIdForNew;
          const convo = state.conversations.find(c => c.id === convoId);
          const charName = convo ? (convo.title || convo.name || "神秘角色") : "神秘角色";

          // ==================== 快照冻结收集 ====================
          let charPersona = "";
          let charBio = "";
          try {
            if (convo && convo.contactId) {
              const char = await currentRoche.character.get(convo.contactId);
              if (char) {
                charPersona = char.persona || "";
                charBio = char.bio || "";
              }
            }
          } catch (e) {
            console.error("Snapshot char persona failed:", e);
          }
          const finalCharPersona = charPersona || charBio || "保持其一贯性格特点。";

          let userPersona = "";
          try {
            const activeUser = await currentRoche.persona.getActiveUserPersona();
            if (activeUser) {
              userPersona = activeUser.persona || activeUser.bio || "";
            }
          } catch (e) {
            console.error("Snapshot user persona failed:", e);
          }

          let coreMemory = "无核心记忆总结";
          let factsListText = "无主线主记忆事实";
          try {
            const lt = await currentRoche.memory.getLongTerm({ conversationId: convoId, limit: 30 });
            if (lt) {
              coreMemory = lt.core?.summary || "";
              factsListText = (lt.facts || []).map(f => f.summaryText || f.action || "").filter(Boolean).join("\n");
            }
          } catch (e) {
            console.error("Snapshot memories failed:", e);
          }

          let mainConvoContext = "";
          try {
            const st = await currentRoche.memory.getShortTerm({ conversationId: convoId, limit: 20 });
            if (st && st.length > 0) {
              mainConvoContext = st.reverse().map(m => {
                const sender = m.senderHandle || m.senderName || "对方";
                return `${sender}: ${m.text}`;
              }).join("\n");
            }
          } catch (e) {
            console.error("Snapshot shortterm context failed:", e);
          }

          const snapshotSlice = {
            charPersona: finalCharPersona,
            userPersona: userPersona,
            coreMemory: coreMemory,
            factsList: factsListText,
            mainConvoContext: mainConvoContext
          };

          const longTermText = `【核心主线记忆背景】：${coreMemory}\n【重要主线事实】：\n${factsListText}`;

          const systemPrompt = `你是一个平行宇宙剧情出线启动器。
正在为角色 [${charName}] 和 用户 开启一个新的剧情分支：
【时间基准】：${timeVal}
【情感基调】：${toneVal}
【额外剧情指导】：${extraVal}

【重要：开启时冻结的角色背景人设 (切勿违背，杜绝OOC)】：
${finalCharPersona}

【重要：开启时冻结的用户人设特质】：
${userPersona}

【重要：开启时冻结的主对话宿主主线记忆】：
${longTermText}

【重要：开启时冻结的主对话上下文历史】：
${mainConvoContext}

请在此分支下，直接以【线下小说体裁】撰写第一幕开局起承。
【强制禁令】：严禁代替“你”（用户）做出任何主动意志决定、具体的肢体动作描写、神态心理解说或输出任何台词！你只能描写角色 ${charName} 的行为、语言、表情、动作、心理活动以及周围环境的发展演进，给用户预留自由反应、回应与决定的空间。
【字数区间强约束】：请将本次生成的篇幅深度控制在 【${minWordsVal}字 至 ${maxWordsVal}字】 之间。客观叙写、不要在此区间外过度冗余或苍促结尾。不可强行截断。
要求：文笔唯美细腻，直接开始正文描写，不要输出任何旁白，字数在400字左右。`;

          const response = await currentRoche.ai.chat({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "请开始你的撰写。" }
            ],
            temperature: 0.8
          });

          const storyText = response.text || "引擎启动失败，未能获取到开局正文。";

          const newIfLine = {
            id: "if-" + crypto.randomUUID(),
            conversationId: state.selectedConvoIdForNew,
            charName: charName,
            time: timeVal,
            tone: toneVal,
            extra: extraVal,
            mode: "offline", 
            messages: [
              {
                role: "assistant",
                text: storyText,
                mode: "offline",
                timestamp: Date.now()
              }
            ],
            mountedWorldbooks: [],
            summaries: [],
            snapshot: snapshotSlice,
            minWords: minWordsVal,
            maxWords: maxWordsVal
          };

          state.activeIfLines.push(newIfLine);
          await savePluginState();

          currentRoche.ui.toast("IF 剧情引擎成功点火！");
          state.currentIfLineId = newIfLine.id;
          state.selectedConvoIdForNew = null;
          state.activeTab = "extend"; 
        } catch (err) {
          console.error(err);
          currentRoche.ui.toast("AI 引擎点火异常");
        } finally {
          state.isGenerating = false;
          render();
        }
      };
    }

    // --- 2. 续约页事件 ---
    const activeIfCards = pluginContainer.querySelectorAll(".se-active-if-card");
    activeIfCards.forEach(card => {
      card.onclick = () => {
        state.currentIfLineId = card.getAttribute("data-id");
        state.showingDetails = false;
        render();
      };
    });

    const btnBackToIfs = pluginContainer.querySelector("#btn-back-to-ifs");
    if (btnBackToIfs) {
      btnBackToIfs.onclick = () => {
        state.currentIfLineId = null;
        render();
      };
    }

    const toggleOnline = pluginContainer.querySelector("#toggle-mode-online");
    const toggleOffline = pluginContainer.querySelector("#toggle-mode-offline");
    if (toggleOnline && toggleOffline) {
      const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
      toggleOnline.onclick = async () => {
        if (currentIf.mode !== "online") {
          currentIf.mode = "online";
          await savePluginState();
          render();
        }
      };
      toggleOffline.onclick = async () => {
        if (currentIf.mode !== "offline") {
          currentIf.mode = "offline";
          await savePluginState();
          render();
        }
      };
    }

    // 双击消息事件委托处理器
    const scrollBox = pluginContainer.querySelector("#chat-messages-scroll");
    if (scrollBox) {
      scrollBox.ondblclick = (e) => {
        const block = e.target.closest(".se-message-block");
        if (block) {
          e.preventDefault();
          const idx = parseInt(block.getAttribute("data-idx"), 10);
          state.activeMenuMessageIndex = idx;
          state.isEditingMessage = false;
          render();
        }
      };
    }

    const btnMenuCancel = pluginContainer.querySelector("#btn-menu-cancel");
    if (btnMenuCancel) {
      btnMenuCancel.onclick = () => {
        state.activeMenuMessageIndex = null;
        render();
      };
    }

    const btnMenuDelete = pluginContainer.querySelector("#btn-menu-delete");
    if (btnMenuDelete) {
      btnMenuDelete.onclick = async () => {
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (currentIf && state.activeMenuMessageIndex !== null) {
          currentIf.messages.splice(state.activeMenuMessageIndex, 1);
          state.activeMenuMessageIndex = null;
          await savePluginState();
          render();
          currentRoche.ui.toast("消息删除成功");
        }
      };
    }

    const btnMenuEdit = pluginContainer.querySelector("#btn-menu-edit");
    if (btnMenuEdit) {
      btnMenuEdit.onclick = () => {
        state.isEditingMessage = true;
        render();
      };
    }

    const btnCancelEditMsg = pluginContainer.querySelector("#btn-cancel-edit-msg");
    if (btnCancelEditMsg) {
      btnCancelEditMsg.onclick = () => {
        state.isEditingMessage = false;
        render();
      };
    }

    const btnSaveEditMsg = pluginContainer.querySelector("#btn-save-edit-msg");
    if (btnSaveEditMsg) {
      btnSaveEditMsg.onclick = async () => {
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        const editArea = pluginContainer.querySelector("#edit-msg-text-area");
        if (currentIf && editArea && state.activeMenuMessageIndex !== null) {
          const textVal = editArea.value.trim();
          if (!textVal) {
            currentRoche.ui.toast("消息内容不能为空");
            return;
          }
          currentIf.messages[state.activeMenuMessageIndex].text = textVal;
          state.activeMenuMessageIndex = null;
          state.isEditingMessage = false;
          await savePluginState();
          render();
          currentRoche.ui.toast("修改保存成功");
        }
      };
    }

    const btnMenuRollback = pluginContainer.querySelector("#btn-menu-rollback");
    if (btnMenuRollback) {
      btnMenuRollback.onclick = async () => {
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (!currentIf || state.activeMenuMessageIndex === null) return;

        const targetIdx = state.activeMenuMessageIndex;
        let rollbackUserIdx = -1;
        for (let i = targetIdx; i >= 0; i--) {
          if (currentIf.messages[i].role === "user") {
            rollbackUserIdx = i;
            break;
          }
        }

        if (rollbackUserIdx !== -1) {
          currentIf.messages = currentIf.messages.slice(0, rollbackUserIdx + 1);
        } else {
          currentIf.messages = [];
        }

        state.activeMenuMessageIndex = null;
        await savePluginState();
        render();

        const triggerBtn = pluginContainer.querySelector("#btn-trigger-ai");
        if (triggerBtn) {
          triggerBtn.click();
        } else {
          if (currentIf.messages.length === 0) {
            state.isGenerating = true;
            render();
            try {
              const charName = currentIf.charName;
              const snapshot = currentIf.snapshot || {};
              const finalCharPersona = snapshot.charPersona || "保持其一贯性格特点。";
              const userPersona = snapshot.userPersona || "";
              const coreMemory = snapshot.coreMemory || "";
              const factsListText = snapshot.factsList || "";
              const mainConvoContext = snapshot.mainConvoContext || "";
              const longTermText = `【核心主线记忆背景】：${coreMemory}\n【重要主线事实】：\n${factsListText}`;

              const systemPrompt = `你是一个平行宇宙剧情出线启动器。
正在为角色 [${charName}] 和 用户 开启一个新的剧情分支：
【时间基准】：${currentIf.time}
【情感基调】：${currentIf.tone}
【额外剧情指导】：${currentIf.extra}

【重要：开启时冻结的角色背景人设 (切勿违背，杜绝OOC)】：
${finalCharPersona}

【重要：开启时冻结的用户人设特质】：
${userPersona}

【重要：开启时冻结的主对话宿主主线记忆】：
${longTermText}

【重要：开启时冻结的主对话上下文历史】：
${mainConvoContext}

请在此分支下，直接以【线下小说体裁】撰写第一幕开局起承。
【强制禁令】：严禁代替“你”（用户）做出任何主动意志决定、具体的肢体动作描写、神态心理解说或输出任何台词！你只能描写角色 ${charName} 的行为、语言、表情、动作、心理活动以及周围环境的发展演进，给用户预留自由反应、回应与决定的空间。
【字数区间强约束】：请将本次生成的篇幅深度控制在 【${currentIf.minWords || 300}字 至 ${currentIf.maxWords || 600}字】 之间。客观叙写、不要在此区间外过度冗余或苍促结尾。不可强行截断。
要求：文笔唯美细腻，直接开始正文描写，不要输出任何旁白，字数在400字左右。`;

              const response = await currentRoche.ai.chat({
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: "请开始你的撰写。" }
                ],
                temperature: 0.8
              });

              currentIf.messages.push({
                role: "assistant",
                text: response.text || "重回初始化失败。",
                mode: "offline",
                timestamp: Date.now()
              });

              await savePluginState();
              currentRoche.ui.toast("剧情成功重回并初始化");
            } catch (err) {
              console.error(err);
              currentRoche.ui.toast("重连重组异常");
            } finally {
              state.isGenerating = false;
              render();
            }
          }
        }
      };
    }

    // 重构输入键盘Enter换行逻辑
    const chatInput = pluginContainer.querySelector("#chat-input");
    if (chatInput) {
      const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
      chatInput.onkeydown = (e) => {
        if (currentIf && currentIf.mode === "online") {
          // 线上模式：回车直接上屏（仿微信）
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const sendBtn = pluginContainer.querySelector("#btn-send-msg");
            if (sendBtn) sendBtn.click();
          }
        } else {
          // 线下叙事：回车作为天然换行符，不会触发上屏
        }
      };
    }

    const btnSendMsg = pluginContainer.querySelector("#btn-send-msg");
    if (btnSendMsg) {
      btnSendMsg.onclick = async () => {
        const inputEl = pluginContainer.querySelector("#chat-input");
        const text = inputEl.value.trim();
        if (!text) return;

        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        currentIf.messages.push({
          role: "user",
          text: text,
          mode: currentIf.mode,
          timestamp: Date.now()
        });

        inputEl.value = "";
        await savePluginState();
        render(); 
      };
    }

    const btnTriggerAi = pluginContainer.querySelector("#btn-trigger-ai");
    if (btnTriggerAi) {
      btnTriggerAi.onclick = async () => {
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (!currentIf) return;

        state.isGenerating = true;
        render();

        try {
          // ==================== 冻结快照绝对防御 ====================
          const snapshot = currentIf.snapshot || {
            charPersona: "保持其一贯性格特点。",
            userPersona: "",
            coreMemory: "无核心记忆总结",
            factsList: "无主记忆事实",
            mainConvoContext: ""
          };

          const finalCharPersona = snapshot.charPersona;
          const userPersona = snapshot.userPersona;
          const longTermText = `【核心主线记忆背景】：${snapshot.coreMemory}\n【重要主线事实】：\n${snapshot.factsList}`;
          const mainConvoContext = snapshot.mainConvoContext;

          const historyText = currentIf.messages.map((m, idx) => {
            const sender = m.role === "user" ? "用户" : currentIf.charName;
            const modeName = m.mode === "online" ? "[线上微信]" : "[线下小说体]";
            return `${idx + 1}. ${modeName} ${sender}: ${m.text}`;
          }).join("\n\n");

          const wbCombined = await fetchWorldbookText(currentIf.mountedWorldbooks);

          let systemPrompt = "";
          if (currentIf.mode === "online") {
            systemPrompt = `你现在进入角色扮演模式。你将扮演角色: ${currentIf.charName}。
这是一个正在演进中的微信聊天（线上）平行宇宙剧情分支出线。

【重要：开启时冻结的角色背景人设 (切勿违背，杜绝OOC)】：
${finalCharPersona}

【重要：开启时冻结的用户人设特质】：
${userPersona}

【重要：开启时冻结的主对话宿主主线记忆】：
${longTermText}

【重要：开启时冻结的主对话上下文历史】：
${mainConvoContext}

【当前IF线的基础设定】：
【设定时间】：${currentIf.time}
// 系统合并当前绝对时间 2026 年
【当下绝对时间标尺】：2026年
【设定基调】：${currentIf.tone}
【额外强制指令】：${currentIf.extra}

【挂载的世界书词条设定】：
${wbCombined}

【本分支IF线已演进的历史轨迹】：
${historyText}

请在当前【微信线上对话场景】下，以【第一人称微信口吻】进行回复。
【多气泡简短连发机制】：
请务必模仿现代人微信聊天连发多条短消息的特征，你必须一次性产生并回复【至少3条】连续发出的简短气泡消息。
这3条消息必须使用特殊的标记字符 "[SPLIT]" 完美隔开。
例如输出规范：
第一条问候或直接短句。[SPLIT]第二条进行追问或表达微表情。[SPLIT]第三条做细节补充或提出互动。

严禁合并成大段话！必须输出用 [SPLIT] 隔开的连贯简短台词。严格保证角色人设本音，杜绝任何OOC行为。绝不携带叙事旁白或解释说明。`;
          } else {
            // 线下续写 Prompt：引入字数区间强约束强提醒
            const minWords = currentIf.minWords || 300;
            const maxWords = currentIf.maxWords || 600;

            systemPrompt = `你是一个高级的小说剧情续写引擎。正在为角色 ${currentIf.charName} 与用户共同编写分支剧情。

【重要：开启时冻结的角色背景人设 (切勿违背，杜绝OOC)】：
${finalCharPersona}

【重要：开启时冻结的用户人设特质】：
${userPersona}

【重要：开启时冻结的主对话宿主主线记忆】：
${longTermText}

【重要：开启时冻结的主对话上下文历史】：
${mainConvoContext}

【当前IF线的基础设定】：
【设定时间】：${currentIf.time}
【当下绝对时间标尺】：2026年
【设定基调】：${currentIf.tone}
【额外强制指令】：${currentIf.extra}

【字数区间强约束】：
请将本次生成的篇幅深度控制在 【${minWords}字 至 ${maxWords}字】 之间。客观叙写、不要在此区间外过度冗余或苍促结尾。不可强行截断。

【挂载的世界书词条设定】：
${wbCombined}

【本分支IF线已演进的历史轨迹】：
${historyText}

请在当前“线下叙事”模式下，继续编写下一阶段的小说长文故事推进。
【强制禁令】：严禁代替“你”（用户）做出任何具体的行为动作、神态描写、言语台词、意志选择或内心活动描述！你只能描写角色 ${currentIf.charName} 的肢体行动、言语对答、情绪神态、内心世界、以及物理环境和情景局势的变化推进，必须把做出反应和自由发声的空间留给用户。
要求：保持角色原本神韵，绝对杜绝任何OOC。直接输出故事小说正文，绝不输出任何叙事外备注、旁白或释义。`;
          }

          const response = await currentRoche.ai.chat({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "请根据上述指令进行后续创作。" }
            ],
            temperature: 0.8
          });

          const replyText = response.text || "AI 续写引擎发生阻断，未返回有效信息。";

          if (currentIf.mode === "online") {
            let parts = replyText.split(/\[SPLIT\]/);
            if (parts.length <= 1) {
              parts = replyText.split(/\n+/).filter(Boolean);
            }
            parts.forEach(part => {
              const trimmed = part.trim();
              if (trimmed) {
                currentIf.messages.push({
                  role: "assistant",
                  text: trimmed,
                  mode: "online",
                  timestamp: Date.now()
                });
              }
            });
            if (currentIf.messages.length > 0 && currentIf.messages[currentIf.messages.length - 1].role === "user") {
              currentIf.messages.push({
                role: "assistant",
                text: replyText,
                mode: "online",
                timestamp: Date.now()
              });
            }
          } else {
            currentIf.messages.push({
              role: "assistant",
              text: replyText,
              mode: "offline",
              timestamp: Date.now()
            });
          }

          await savePluginState();
        } catch (e) {
          console.error(e);
          currentRoche.ui.toast("剧情推进生成异常");
        } finally {
          state.isGenerating = false;
          render();
        }
      };
    }

    // --- 续约详情配置页 ---
    const btnOpenDetails = pluginContainer.querySelector("#btn-open-details");
    if (btnOpenDetails) {
      btnOpenDetails.onclick = async () => {
        try {
          const wbs = await currentRoche.worldbook.list() || [];
          state.detailsState.worldbooks = wbs;
        } catch (e) {
          console.error(e);
        }
        state.showingDetails = true;
        render();
      };
    }

    const btnCloseDetails = pluginContainer.querySelector("#btn-close-details");
    if (btnCloseDetails) {
      btnCloseDetails.onclick = () => {
        state.showingDetails = false;
        render();
      };
    }

    const wbCheckboxes = pluginContainer.querySelectorAll(".wb-checkbox");
    wbCheckboxes.forEach(cb => {
      cb.onchange = async () => {
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (!currentIf) return;
        const selectedWbs = [];
        pluginContainer.querySelectorAll(".wb-checkbox:checked").forEach(checkedEl => {
          selectedWbs.push(checkedEl.value);
        });
        currentIf.mountedWorldbooks = selectedWbs;
        await savePluginState();
      };
    });

    // 详情页监听：线下字数区间变更
    const detailMinWords = pluginContainer.querySelector("#detail-snapshot-time");
    const detailMaxWords = pluginContainer.querySelector("#detail-max-words");
    if (detailMinWords && detailMaxWords) {
      const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
      const saveWords = async () => {
        if (currentIf) {
          currentIf.minWords = parseInt(detailMinWords.value, 10) || 300;
          currentIf.maxWords = parseInt(detailMaxWords.value, 10) || 600;
          await savePluginState();
        }
      };
      detailMinWords.onchange = saveWords;
      detailMaxWords.onchange = saveWords;
    }

    // 详情页操作：物理删除当前 IF 线
    const btnDeleteActiveIf = pluginContainer.querySelector("#btn-delete-active-if");
    if (btnDeleteActiveIf) {
      btnDeleteActiveIf.onclick = async () => {
        const ok = await currentRoche.ui.confirm({
          title: "确认删除此平行分支？",
          message: "删除后该分支的所有聊天和叙事记录将永久丢失（主线对话不受影响）。是否确认？"
        });
        if (ok) {
          state.activeIfLines = state.activeIfLines.filter(x => x.id !== state.currentIfLineId);
          state.currentIfLineId = null;
          state.showingDetails = false;
          await savePluginState();
          render();
          currentRoche.ui.toast("分支删除成功");
        }
      };
    }

    const btnGenSummary = pluginContainer.querySelector("#btn-gen-summary");
    if (btnGenSummary) {
      btnGenSummary.onclick = async () => {
        const fromVal = parseInt(pluginContainer.querySelector("#sum-from").value, 10);
        const toVal = parseInt(pluginContainer.querySelector("#sum-to").value, 10);

        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (!currentIf) return;

        if (isNaN(fromVal) || isNaN(toVal) || fromVal < 1 || toVal > currentIf.messages.length || fromVal > toVal) {
          currentRoche.ui.toast("请输入合法的段落区间数");
          return;
        }

        state.isGeneratingSummary = true; 
        render();

        try {
          const segmentText = currentIf.messages.slice(fromVal - 1, toVal).map((m, i) => {
            const num = fromVal + i;
            const sender = m.role === "user" ? "用户" : currentIf.charName;
            return `[第 ${num} 段] ${sender}: ${m.text}`;
          }).join("\n\n");

          const response = await currentRoche.ai.chat({
            messages: [
              {
                role: "system",
                content: `请对以下指定区间的剧情记录进行精简、连贯的概要总结。
【严格铁律限制】：
1. 总结内容的总字数必须严格控制在200字以内，不要超出！
2. 文体必须采用绝对客观、写实且中立的“事实客观叙述文体”，不带任何感情倾向、虚构渲染、抒情词汇或旁白式主观议论：\n\n${segmentText}`
              }
            ],
            temperature: 0.7
          });

          const resText = response.text || "总结生成失败";

          currentIf.summaries = currentIf.summaries || [];
          currentIf.summaries.push({
            id: "sum-" + crypto.randomUUID(),
            from: fromVal,
            to: toVal,
            text: resText,
            timestamp: Date.now(),
            isExpanded: false
          });

          await savePluginState();
          currentRoche.ui.toast("总结生成成功并保存");
        } catch (e) {
          console.error(e);
          currentRoche.ui.toast("总结获取失败");
        } finally {
          state.isGeneratingSummary = false;
          render();
        }
      };
    }

    pluginContainer.querySelectorAll(".btn-toggle-sum").forEach(btn => {
      btn.onclick = async () => {
        const sumId = btn.getAttribute("data-id");
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        const sum = currentIf.summaries.find(s => s.id === sumId);
        if (sum) {
          sum.isExpanded = !sum.isExpanded;
          await savePluginState();
          render();
        }
      };
    });

    pluginContainer.querySelectorAll(".btn-save-sum").forEach(btn => {
      btn.onclick = async () => {
        const sumId = btn.getAttribute("data-id");
        const textarea = pluginContainer.querySelector(`.se-summary-edit-area[data-id="${sumId}"]`);
        if (!textarea) return;

        const textVal = textarea.value.trim();
        if (!textVal) {
          currentRoche.ui.toast("总结内容不能为空");
          return;
        }

        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        const sum = currentIf.summaries.find(s => s.id === sumId);
        if (sum) {
          sum.text = textVal;
          sum.isExpanded = false; 
          await savePluginState();
          render();
          currentRoche.ui.toast("编辑保存成功");
        }
      };
    });

    pluginContainer.querySelectorAll(".btn-delete-sum").forEach(btn => {
      btn.onclick = async () => {
        const sumId = btn.getAttribute("data-id");
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (currentIf) {
          currentIf.summaries = currentIf.summaries.filter(s => s.id !== sumId);
          await savePluginState();
          render();
          currentRoche.ui.toast("已删除该总结");
        }
      };
    });

    const btnEndIf = pluginContainer.querySelector("#btn-end-if");
    if (btnEndIf) {
      btnEndIf.onclick = async () => {
        const ok = await currentRoche.ui.confirm({
          title: "确认结束并归档",
          message: "是否确认结束这一分支，它将被封存归档到“后台”进行后续记忆注入与整理？"
        });

        if (ok) {
          const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
          if (currentIf) {
            state.activeIfLines = state.activeIfLines.filter(x => x.id !== currentIf.id);
            state.endedIfLines.push(currentIf);
            await savePluginState();

            currentRoche.ui.toast("已结束此 IF 分支并归档。");
            state.currentIfLineId = null;
            state.showingDetails = false;
            state.activeTab = "backend";
            render();
          }
        }
      };
    }

    // --- 3. 后台归档页事件 ---
    const endedIfCards = pluginContainer.querySelectorAll(".se-ended-if-card");
    endedIfCards.forEach(card => {
      card.onclick = () => {
        state.viewingEndedLineId = card.getAttribute("data-id");
        render();
      };
    });

    const btnBackToBackend = pluginContainer.querySelector("#btn-back-to-backend");
    if (btnBackToBackend) {
      btnBackToBackend.onclick = () => {
        state.viewingEndedLineId = null;
        render();
      };
    }

    // 后台页操作：物理删除已结束的 IF 线
    const btnDeleteEndedIf = pluginContainer.querySelector("#btn-delete-ended-if");
    if (btnDeleteEndedIf) {
      btnDeleteEndedIf.onclick = async () => {
        const ok = await currentRoche.ui.confirm({
          title: "确认删除此存档？",
          message: "删除后该存档及所有的对话记录将永久丢失。是否确认？"
        });
        if (ok) {
          state.endedIfLines = state.endedIfLines.filter(x => x.id !== state.viewingEndedLineId);
          state.viewingEndedLineId = null;
          await savePluginState();
          render();
          currentRoche.ui.toast("存档删除成功");
        }
      };
    }

    const btnInjectMainMem = pluginContainer.querySelector("#btn-inject-main-mem");
    if (btnInjectMainMem) {
      btnInjectMainMem.onclick = async () => {
        const endedIf = state.endedIfLines.find(x => x.id === state.viewingEndedLineId);
        if (!endedIf) return;

        state.isGenerating = true; 
        render();

        try {
          const fullHistory = endedIf.messages.map(m => {
            return `${m.role === "user" ? "用户" : endedIf.charName}: ${m.text}`;
          }).join("\n\n");

          const response = await currentRoche.ai.chat({
            messages: [
              {
                role: "system",
                content: `请将以下在平行 IF 出线里发生的事件、人物关系心路变化提炼成一段极其精炼的、用于写入宿主长期事实记忆中的客观事实。
【严格铁律限制】：
1. 提炼的字数必须严格限制在200字以内，严禁超出！
2. 提炼文体必须采用最陈述、客观中立的“事实客观叙述文体”，杜绝任何主观渲染、抒情词汇、议论或虚构旁白。

剧情记录如下：
${fullHistory}`
              }
            ],
            temperature: 0.7
          });

          const memorySummary = (response.text || "").trim();

          state.isGenerating = false;
          render();

          const ok = await currentRoche.ui.confirm({
            title: "确认注入宿主主记忆数据库？",
            message: `以下为生成的记忆事实描述：\n\n"${memorySummary}"\n\n【注意】：此数据将永久写入 Roche 宿主此角色的主 facts 记忆库中。确认注入吗？`
          });

          if (ok) {
            await currentRoche.memory.write({
              conversationId: endedIf.conversationId,
              summaryText: memorySummary, 
              action: memorySummary,       
              who: ["用户", endedIf.charName],
              when: endedIf.time || "过去",
              where: "平行剧情出线中",
              source: "story-engine-plugin"
            });
            currentRoche.ui.toast("已成功将平行剧情事实写入主记忆中！");
          }
        } catch (e) {
          console.error(e);
          currentRoche.ui.toast("生成总结或注入失败");
        } finally {
          state.isGenerating = false;
          render();
        }
      };
    }
  }

  window.RochePlugin.register({
    id: "roche-story-engine",
    name: "剧情引擎",
    version: "1.0.7",
    apps: [
      {
        id: "roche-story-engine-home",
        name: "剧情引擎",
        icon: "extension",
        iconImage: "",
        async mount(container, roche) {
          currentRoche = roche;
          pluginContainer = container;

          // 1. 动态注入自适应样式
          const styleId = "se-plugin-style";
          let styleEl = document.getElementById(styleId);
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            styleEl.innerHTML = `
              .roche-plugin-story-engine {
                --se-bg: #f8fafc; 
                --se-surface: #ffffff; 
                --se-border: #e2e8f0; 
                --se-text: #0f172a; 
                --se-text-muted: #64748b; 
                --se-primary: #4f46e5; 
                --se-primary-hover: #4338ca; 
                --se-danger: #ef4444; 
                --se-success: #10b981;
                --se-input-bg: #f1f5f9;
                
                display: flex;
                flex-direction: column;
                height: 100%;
                background-color: var(--se-bg);
                color: var(--se-text);
                font-family: system-ui, -apple-system, sans-serif;
                position: relative;
                overflow: hidden;
              }

              /* 顶栏 */
              .se-header {
                height: 56px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                border-bottom: 1px solid var(--se-border);
                background-color: var(--se-surface);
                position: relative;
              }
              .se-header-loading {
                background: linear-gradient(90deg, #ffffff 0%, #e0e7ff 50%, #ffffff 100%);
                background-size: 200% 100%;
                animation: se-glow 1.5s infinite linear;
              }
              @keyframes se-glow {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              .se-header-text {
                font-size: 16px;
                font-weight: 600;
              }

              /* 主视口 */
              .se-main {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
              }

              /* 沉浸式全屏布局 */
              .se-main-full {
                padding: 0 !important;
                height: 100% !important;
                display: flex;
                flex-direction: column;
              }

              /* 绝对定位遮罩层（全端动作响应提示） */
              .se-overlay {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: rgba(255, 255, 255, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(1.5px);
                border-radius: 8px;
              }
              .se-overlay-card {
                background-color: var(--se-surface);
                border: 1px solid var(--se-border);
                padding: 24px;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                font-weight: 600;
                color: var(--se-primary);
                font-size: 14px;
              }
              .se-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid var(--se-border);
                border-top-color: var(--se-primary);
                border-radius: 50%;
                animation: se-spin 0.8s infinite linear;
              }
              @keyframes se-spin {
                100% { transform: rotate(360deg); }
              }

              /* 消息高级操作菜单卡片 */
              .se-context-menu-card {
                width: 320px;
                max-width: 90%;
              }
              .se-context-menu-title {
                font-size: 15px;
                font-weight: 700;
                color: var(--se-primary);
                margin-bottom: 8px;
                text-align: center;
              }
              .se-context-menu-preview {
                font-size: 12px;
                color: var(--se-text-muted);
                line-height: 1.4;
                background-color: var(--se-bg);
                padding: 8px;
                border-radius: 6px;
                margin-bottom: 16px;
                word-break: break-all;
              }
              .se-context-menu-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 100%;
              }
              .se-context-menu-row {
                display: flex;
                gap: 8px;
                width: 100%;
                margin-top: 12px;
              }
              .btn-menu-action {
                width: 100%;
                justify-content: center;
              }

              /* 简约面板 */
              .se-panel {
                display: flex;
                flex-direction: column;
                gap: 12px;
              }
              .se-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .se-panel-title {
                font-size: 18px;
                font-weight: 700;
              }
              .se-panel-desc {
                font-size: 13px;
                color: var(--se-text-muted);
                line-height: 1.5;
              }

              /* 列表 */
              .se-list-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 8px;
              }
              .se-convo-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border: 1px solid var(--se-border);
                border-radius: 8px;
                background-color: var(--se-surface);
                cursor: pointer;
                transition: background-color 0.2s;
              }
              .se-convo-item:hover {
                background-color: #f1f5f9;
              }
              .se-convo-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 1px solid var(--se-border);
              }
              .se-convo-avatar-placeholder {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: var(--se-border);
              }
              .se-convo-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
              }
              .se-convo-name {
                font-weight: 600;
                font-size: 14px;
              }
              .se-convo-type {
                font-size: 12px;
                color: var(--se-text-muted);
              }

              /* IF 卡片 */
              .se-active-if-card, .se-ended-if-card {
                padding: 16px;
                border: 1px solid var(--se-border);
                border-radius: 8px;
                background-color: var(--se-surface);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 8px;
                transition: background-color 0.2s;
              }
              .se-active-if-card:hover, .se-ended-if-card:hover {
                background-color: #f1f5f9;
              }
              .se-if-card-title {
                font-weight: 700;
                font-size: 15px;
              }
              .se-if-card-meta {
                display: flex;
                gap: 12px;
                font-size: 12px;
                color: var(--se-text-muted);
              }
              .se-if-card-desc {
                font-size: 13px;
                color: var(--se-text-muted);
                line-height: 1.4;
              }

              /* 表单框架 */
              .se-form-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 16px;
                background-color: var(--se-bg);
                overflow-y: auto;
              }
              .se-form-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
              }
              .se-form-title {
                font-size: 16px;
                font-weight: 600;
              }
              .se-form-body {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }
              .se-form-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              .se-form-group label {
                font-size: 13px;
                color: var(--se-text-muted);
                font-weight: 500;
              }
              .se-form-group input, .se-form-group select, .se-form-group textarea {
                background-color: var(--se-surface);
                border: 1px solid var(--se-border);
                border-radius: 6px;
                padding: 10px;
                color: var(--se-text);
                font-size: 14px;
                outline: none;
              }
              .se-form-group input:focus, .se-form-group select:focus, .se-form-group textarea:focus {
                border-color: var(--se-primary);
                background-color: #fff;
              }
              .se-form-row {
                display: flex;
                gap: 12px;
              }
              .se-form-row .se-form-group {
                flex: 1;
              }

              /* 后台归档查看拉伸自适应 */
              .se-backend-log-view {
                height: 100%;
                display: flex;
                flex-direction: column;
              }
              .se-log-body-stretch {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 0; 
              }
              .se-log-box {
                flex: 1;
                overflow-y: auto;
                border: 1px solid var(--se-border);
                padding: 12px;
                border-radius: 8px;
                background-color: #fff;
              }

              /* 交互聊天室 */
              .se-chat-container {
                display: flex;
                flex-direction: column;
                height: 100%;
              }
              .se-chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid var(--se-border);
                background-color: var(--se-surface);
                padding: 14px 16px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.01);
              }
              .se-chat-title-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
              }
              .se-chat-title {
                font-size: 15px;
                font-weight: 700;
              }
              .se-chat-mode-toggle {
                display: flex;
                background-color: var(--se-input-bg);
                border: 1px solid var(--se-border);
                border-radius: 6px;
                padding: 2px;
              }
              .se-toggle-item {
                border: none;
                background: none;
                color: var(--se-text-muted);
                padding: 4px 8px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                border-radius: 4px;
              }
              .se-toggle-item.active {
                background-color: var(--se-surface);
                color: var(--se-text);
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
              }

              .se-chat-messages {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding: 16px;
              }

              /* 线上微信对讲 */
              .se-chat-viewport-wechat {
                background-color: #ededed !important; 
              }
              .se-bubble-wrapper {
                display: flex;
                flex-direction: column;
                max-width: 85%;
              }
              .se-bubble-right {
                align-self: flex-end;
                align-items: flex-end;
              }
              .se-bubble-left {
                align-self: flex-start;
                align-items: flex-start;
              }
              .se-bubble-sender {
                font-size: 11px;
                color: var(--se-text-muted);
                margin-bottom: 4px;
              }
              .se-bubble-num {
                font-size: 10px;
                opacity: 0.5;
              }
              .se-bubble-box {
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 14.5px;
                line-height: 1.5;
                word-break: break-all;
              }
              .se-bubble-left .se-bubble-box {
                background-color: #ffffff;
                color: #191919;
                border: 1px solid #e1e1e1;
              }
              .se-bubble-right .se-bubble-box {
                background-color: #95ec69; 
                color: #191919;
                border: 1px solid #83d45a;
              }

              /* 线下文学 */
              .se-narrative-block {
                padding: 16px;
                background-color: #f1f5f9;
                border-left: 3px solid var(--se-primary);
                margin: 4px 0;
                border-radius: 0 8px 8px 0;
                cursor: pointer;
              }
              .se-narrative-meta {
                font-size: 11px;
                color: var(--se-primary);
                margin-bottom: 8px;
                font-weight: 600;
              }
              .se-narrative-text {
                font-family: "Georgia", "Source Han Serif SC", serif;
                font-size: 15px;
                line-height: 1.8;
                color: #334155;
                letter-spacing: 0.5px;
              }

              /* 线下指令 */
              .se-narrative-block-user {
                padding: 14px 16px;
                background-color: #f8fafc;
                border-left: 3px dashed #94a3b8;
                margin: 4px 0;
                border-radius: 0 8px 8px 0;
                cursor: pointer;
              }
              .se-narrative-block-user .se-narrative-meta {
                color: #64748b;
                font-size: 11px;
                margin-bottom: 8px;
                font-weight: 600;
              }
              .se-narrative-block-user .se-narrative-text {
                font-family: system-ui, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #475569;
                font-style: italic;
              }

              .se-message-block {
                transition: outline 0.15s ease;
              }
              .se-message-block:hover {
                outline: 1.5px dashed rgba(79, 70, 229, 0.4);
                border-radius: 8px;
              }

              /* 时空记忆快照 */
              .se-snapshot-visualizer {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 8px;
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid var(--se-border);
                padding: 10px;
                border-radius: 6px;
                background-color: var(--se-input-bg);
              }
              .se-snapshot-item-block {
                display: flex;
                flex-direction: column;
                gap: 4px;
                border-bottom: 1px dashed var(--se-border);
                padding-bottom: 8px;
              }
              .se-snapshot-item-block:last-child {
                border-bottom: none;
                padding-bottom: 0;
              }
              .se-snapshot-sub-title {
                font-size: 11px;
                font-weight: 700;
                color: var(--se-primary);
                text-transform: uppercase;
              }
              .se-snapshot-sub-body {
                font-size: 11.5px;
                color: var(--se-text-muted);
                line-height: 1.4;
                word-break: break-all;
              }

              /* 跨段总结堆叠 */
              .se-summaries-stack {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 8px;
              }
              .se-summary-item {
                border: 1px solid var(--se-border);
                border-radius: 8px;
                background-color: var(--se-surface);
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              .se-summary-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .se-summary-item-title {
                font-size: 13px;
                font-weight: 700;
                color: var(--se-primary);
              }
              .se-summary-item-actions {
                display: flex;
                gap: 8px;
              }
              .se-summary-item-preview {
                font-size: 13px;
                color: var(--se-text-muted);
                line-height: 1.4;
              }
              .se-summary-item-body {
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              .se-summary-edit-area {
                width: 100%;
                min-height: 80px;
                border: 1px solid var(--se-border);
                border-radius: 6px;
                padding: 8px;
                font-size: 13px;
                background-color: var(--se-bg);
                color: var(--se-text);
                resize: vertical;
                outline: none;
              }
              .se-summary-edit-area:focus {
                border-color: var(--se-primary);
                background-color: #fff;
              }

              /* 重构后的右置微信化输入框布局 */
              .se-chat-footer-reconstructed {
                display: flex;
                align-items: flex-end;
                gap: 8px;
                border-top: 1px solid var(--se-border);
                background-color: var(--se-surface);
                padding: 12px 16px;
              }
              .se-chat-footer-reconstructed textarea {
                flex: 1;
                background-color: var(--se-bg);
                border: 1px solid var(--se-border);
                border-radius: 6px;
                padding: 10px 12px;
                color: var(--se-text);
                font-size: 13.5px;
                resize: none;
                outline: none;
                min-height: 40px;
                max-height: 120px;
              }
              .se-chat-footer-buttons-aside {
                display: flex;
                gap: 6px;
                align-items: center;
                height: 40px;
              }
              .se-btn-icon-aside {
                width: 36px;
                height: 36px;
                border-radius: 6px;
                border: 1px solid var(--se-border);
                background-color: var(--se-surface);
                color: var(--se-text-muted);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
              }
              .se-btn-icon-aside:hover {
                color: var(--se-text);
                background-color: var(--se-input-bg);
              }
              .se-btn-primary-aside {
                background-color: var(--se-primary);
                color: #ffffff;
                border-color: var(--se-primary);
              }
              .se-btn-primary-aside:hover {
                background-color: var(--se-primary-hover);
                color: #ffffff;
                border-color: var(--se-primary-hover);
              }

              .se-divider { height: 1px; background-color: var(--se-border); margin: 8px 0; }
              .se-summary-box { background-color: #fef3c7; border: 1px dashed #f59e0b; padding: 12px; border-radius: 6px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; color: #78350f; }

              /* 归档 */
              .se-log-box { display: flex; flex-direction: column; gap: 12px; max-height: 320px; overflow-y: auto; border: 1px solid var(--se-border); padding: 10px; border-radius: 6px; background-color: #fff; }
              .se-log-item { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid var(--se-border); padding-bottom: 8px; }
              .se-log-meta { font-size: 11px; color: var(--se-primary); font-weight: 600; }
              .se-log-text { font-size: 13px; line-height: 1.5; color: #334155; }

              /* 空白占位 */
              .se-empty { padding: 40px 16px; text-align: center; color: var(--se-text-muted); font-size: 13px; border: 1px dashed var(--se-border); border-radius: 8px; background: #fff; }
              .se-empty-sub { text-align: center; color: var(--se-text-muted); font-size: 12px; padding: 12px 0; }

              /* 底部 DOCK */
              .se-dock {
                height: 60px;
                border-top: 1px solid var(--se-border);
                background-color: var(--se-surface);
                display: flex;
              }
              .se-dock-item {
                flex: 1;
                border: none;
                background: none;
                color: var(--se-text-muted);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                cursor: pointer;
              }
              .se-dock-item.active {
                color: var(--se-primary);
              }
              .se-dock-item span {
                font-size: 10px;
                font-weight: 500;
              }
            `;
            document.head.appendChild(styleEl);
          }

          await loadPluginState();
          render();
        },
        async unmount(container, roche) {
          if (container) {
            container.replaceChildren();
          }
          currentRoche = null;
          pluginContainer = null;

          const styleEl = document.getElementById("se-plugin-style");
          if (styleEl) styleEl.remove();
        }
      }
    ]
  });
})();