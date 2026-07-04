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
    checkmark: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  };

  // 插件状态定义
  let state = {
    activeTab: "select", // select | extend | backend
    conversations: [], // 同步过来的 Roche 原始会话
    activeIfLines: [], // 进行中的 IF 线
    endedIfLines: [],  // 已结束的 IF 线

    // 交互辅助状态
    currentIfLineId: null, // 当前“续约”页正在查看的 IF 线 ID
    selectedConvoIdForNew: null, // “选择”页点进具体对话，准备开启引擎的会话 ID
    isGenerating: false, // 对方回复中的状态锁定
    showingDetails: false, // “续约”页右上角详情页显隐

    // 新建 IF 线的暂存表单
    newIfForm: {
      time: "当下",
      tone: "浪漫",
      extra: ""
    },

    // 详情页辅助暂存
    detailsState: {
      sumFrom: 1,
      sumTo: 3,
      summaryResult: "",
      worldbooks: [] // 可供挂载的世界书列表
    },

    // 后台页查看特定已结束线
    viewingEndedLineId: null
  };

  // 写入存储
  async function savePluginState() {
    if (!currentRoche) return;
    try {
      await currentRoche.storage.set("story_engine_data", {
        activeIfLines: state.activeIfLines,
        endedIfLines: state.endedIfLines
      });
    } catch (e) {
      console.error("Failed to save Story Engine state:", e);
    }
  }

  // 读取存储
  async function loadPluginState() {
    if (!currentRoche) return;
    try {
      const data = await currentRoche.storage.get("story_engine_data");
      if (data) {
        state.activeIfLines = data.activeIfLines || [];
        state.endedIfLines = data.endedIfLines || [];
      }
    } catch (e) {
      console.error("Failed to load Story Engine state:", e);
    }
  }

  // 同步 Roche 会话进度
  async function syncConversations() {
    if (!currentRoche) return;
    try {
      state.conversations = await currentRoche.conversation.list() || [];
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

    // 更新顶栏“对方回复中”的过渡样式
    const headerClass = state.isGenerating ? "se-header-loading" : "";
    const headerTitleText = state.isGenerating ? "对方回复中…" : "剧情引擎";

    let mainContentHtml = "";

    // 1. 渲染：选择页 (Select Tab)
    if (state.activeTab === "select") {
      if (state.selectedConvoIdForNew) {
        // 渲染开启引擎配置表单
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
        // 渲染对话列表
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

    // 2. 渲染：续约页 (Extend Tab)
    else if (state.activeTab === "extend") {
      if (state.currentIfLineId) {
        const currentIf = state.activeIfLines.find(x => x.id === state.currentIfLineId);
        if (!currentIf) {
          state.currentIfLineId = null;
          render();
          return;
        }

        if (state.showingDetails) {
          // 渲染详情页设置
          const wbOptionsHtml = state.detailsState.worldbooks.map(wb => {
            const isChecked = currentIf.mountedWorldbooks && currentIf.mountedWorldbooks.includes(wb.id);
            return `
              <label class="se-checkbox-label">
                <input type="checkbox" class="wb-checkbox" value="${wb.id}" ${isChecked ? "checked" : ""} />
                <span>${wb.name || "未分类世界书"}</span>
              </label>
            `;
          }).join("");

          mainContentHtml = `
            <div class="se-form-container">
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

                <div class="se-section-title">跨段总结 (第 M 至 N 段)</div>
                <div class="se-form-row">
                  <div class="se-form-group">
                    <label>起始序号</label>
                    <input type="number" id="sum-from" value="${state.detailsState.sumFrom}" min="1" max="${currentIf.messages.length}" />
                  </div>
                  <div class="se-form-group">
                    <label>结束序号</label>
                    <input type="number" id="sum-to" value="${state.detailsState.sumTo}" min="1" max="${currentIf.messages.length}" />
                  </div>
                </div>
                <button class="se-btn-secondary" id="btn-gen-summary">生成选定区间总结</button>
                ${state.detailsState.summaryResult ? `
                  <div class="se-summary-box">
                    <strong>总结结果:</strong>
                    <p>${state.detailsState.summaryResult}</p>
                  </div>
                ` : ""}

                <div class="se-divider"></div>

                <button class="se-btn-danger" id="btn-end-if">结束此 IF 线</button>
              </div>
            </div>
          `;
        } else {
          // 渲染交互主聊天窗
          const msgListHtml = currentIf.messages.map((m, idx) => {
            if (m.mode === "offline") {
              // 线下模式：第三人称长叙事优雅样式
              return `
                <div class="se-narrative-block">
                  <div class="se-narrative-meta">#${idx + 1} 线下续写叙事</div>
                  <div class="se-narrative-text">${m.text.replace(/\n/g, "<br>")}</div>
                </div>
              `;
            } else {
              // 线上模式：对话气泡
              const isUser = m.role === "user";
              const sideClass = isUser ? "se-bubble-right" : "se-bubble-left";
              const sender = isUser ? "我" : currentIf.charName;
              return `
                <div class="se-bubble-wrapper ${sideClass}">
                  <div class="se-bubble-sender">${sender} <span class="se-bubble-num">#${idx + 1}</span></div>
                  <div class="se-bubble-box">${m.text.replace(/\n/g, "<br>")}</div>
                </div>
              `;
            }
          }).join("");

          mainContentHtml = `
            <div class="se-chat-container">
              <div class="se-chat-header">
                <button class="se-btn-icon" id="btn-back-to-ifs">${SVGS.arrowLeft}</button>
                <div class="se-chat-title-wrapper">
                  <div class="se-chat-title">${currentIf.charName} (IF线)</div>
                  <div class="se-chat-mode-toggle">
                    <button class="se-toggle-item ${currentIf.mode === "online" ? "active" : ""}" id="toggle-mode-online">线上模式</button>
                    <button class="se-toggle-item ${currentIf.mode === "offline" ? "active" : ""}" id="toggle-mode-offline">线下叙事</button>
                  </div>
                </div>
                <button class="se-btn-icon" id="btn-open-details">${SVGS.settings}</button>
              </div>
              
              <div class="se-chat-messages" id="chat-messages-scroll">
                ${msgListHtml}
              </div>

              <div class="se-chat-footer">
                <textarea id="chat-input" placeholder="${currentIf.mode === "online" ? "输入多条你想说的话（线上模式）..." : "给下一个叙事段落添加行动指令（可选）..."}" rows="2"></textarea>
                <div class="se-chat-footer-actions">
                  <button class="se-btn-secondary" id="btn-send-msg" style="flex: 1;">发送输入</button>
                  <button class="se-btn-primary" id="btn-trigger-ai" style="flex: 1;">
                    ${currentIf.mode === "online" ? "获取对方回复" : "推进剧情叙事"}
                  </button>
                </div>
              </div>
            </div>
          `;
        }
      } else {
        // 无选中的 IF 线，展示列表中
        const activeIfsHtml = state.activeIfLines.map(item => {
          return `
            <div class="se-if-card" data-id="${item.id}">
              <div class="se-if-card-title">${item.charName} 平行宇宙</div>
              <div class="se-if-card-meta">
                <span>时间: ${item.time}</span>
                <span>基调: ${item.tone}</span>
                <span>长度: ${item.messages.length} 段</span>
              </div>
              <div class="se-if-card-desc">${item.messages[item.messages.length - 1]?.text.substring(0, 60)}...</div>
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
          <div class="se-form-container">
            <div class="se-form-header">
              <button class="se-btn-icon" id="btn-back-to-backend">${SVGS.arrowLeft}</button>
              <div class="se-form-title">查看已归档的 IF 线记录</div>
            </div>
            <div class="se-form-body">
              <div class="se-form-group">
                <button class="se-btn-primary" id="btn-inject-main-mem">生成总结并注入宿主主记忆</button>
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
            <div class="se-if-card" data-id="${item.id}">
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

    // 核心骨架 HTML
    pluginContainer.innerHTML = `
      <div class="roche-plugin-story-engine">
        <!-- 全局顶栏 -->
        <div class="se-header ${headerClass}">
          <div class="se-header-indicator"></div>
          <div class="se-header-text">${headerTitleText}</div>
          <button class="se-btn-icon" id="btn-close-app">${SVGS.close}</button>
        </div>

        <!-- 渲染主页面 -->
        <div class="se-main">
          ${mainContentHtml}
        </div>

        <!-- 底部 Dock 切换 -->
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

    // 绑定所有的 DOM 交互事件
    bindAllEvents();

    // 滚动条自动最底（如果处于聊天交互态中）
    const scrollBox = pluginContainer.querySelector("#chat-messages-scroll");
    if (scrollBox) {
      scrollBox.scrollTop = scrollBox.scrollHeight;
    }
  }

  // 获取世界书内容拼合
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

  // 绑定事件处理器（由于每次重绘，事件都要重新绑定）
  function bindAllEvents() {
    if (!pluginContainer || !currentRoche) return;

    // --- 全局顶栏和 Dock 切换 ---
    pluginContainer.querySelector("#btn-close-app").onclick = () => currentRoche.ui.closeApp();

    pluginContainer.querySelector("#dock-tab-select").onclick = () => {
      if (state.isGenerating) return;
      state.activeTab = "select";
      state.selectedConvoIdForNew = null;
      render();
    };
    pluginContainer.querySelector("#dock-tab-extend").onclick = () => {
      if (state.isGenerating) return;
      state.activeTab = "extend";
      state.showingDetails = false;
      render();
    };
    pluginContainer.querySelector("#dock-tab-backend").onclick = () => {
      if (state.isGenerating) return;
      state.activeTab = "backend";
      state.viewingEndedLineId = null;
      render();
    };

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

        state.newIfForm = { time: timeVal, tone: toneVal, extra: extraVal };
        state.isGenerating = true;
        render();

        try {
          const convo = state.conversations.find(c => c.id === state.selectedConvoIdForNew);
          const charName = convo ? (convo.title || convo.name || "神秘角色") : "神秘角色";

          // 获取记忆作为上下文背景
          const memories = await currentRoche.memory.getLongTerm({
            conversationId: state.selectedConvoIdForNew,
            limit: 40
          });

          const coreText = memories?.core?.summary || "";
          const factsText = (memories?.facts || []).map(f => f.summaryText || f.action || "").join("\n");
          const backgroundContext = `${coreText}\n${factsText}`;

          const systemPrompt = `你是一个平行宇宙剧情出线启动器。
正在为角色 [${charName}] 和 用户 开启一个新的剧情分支：
【时间基准】：${timeVal}
【情感基调】：${toneVal}
【额外剧情指导】：${extraVal}

【主线已知的记忆和人设基础背景】：
${backgroundContext}

请在此分支下，直接以【线下小说体裁】（第三人称叙述角色 ${charName}，第二人称“你”代指用户）撰写第一幕开局起承。
要求：文笔唯美细腻、情节自然衔接，不要输出任何旁白，直接开启正文描写，字数在400字左右。`;

          const response = await currentRoche.ai.chat({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "请开始你的撰写。" }
            ],
            temperature: 0.8
          });

          const storyText = response.text || "引擎启动失败，未能获取到开局正文。";

          // 创建一条新的 IF 线
          const newIfLine = {
            id: "if-" + crypto.randomUUID(),
            conversationId: state.selectedConvoIdForNew,
            charName: charName,
            time: timeVal,
            tone: toneVal,
            extra: extraVal,
            mode: "offline", // 默认先以下线叙事开局
            messages: [
              {
                role: "assistant",
                text: storyText,
                mode: "offline",
                timestamp: Date.now()
              }
            ],
            mountedWorldbooks: []
          };

          state.activeIfLines.push(newIfLine);
          await savePluginState();

          currentRoche.ui.toast("IF 剧情引擎成功点火！");
          state.currentIfLineId = newIfLine.id;
          state.selectedConvoIdForNew = null;
          state.activeTab = "extend"; // 开启后切换到续约页
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
    const activeIfCards = pluginContainer.querySelectorAll(".se-if-card");
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
          // 整理历史记录
          const historyText = currentIf.messages.map((m, idx) => {
            const sender = m.role === "user" ? "用户" : currentIf.charName;
            const modeName = m.mode === "online" ? "[线上对话]" : "[线下叙事]";
            return `${idx + 1}. ${modeName} ${sender}: ${m.text}`;
          }).join("\n\n");

          const wbCombined = await fetchWorldbookText(currentIf.mountedWorldbooks);

          let systemPrompt = "";
          if (currentIf.mode === "online") {
            systemPrompt = `你现在进入角色扮演模式。你将扮演角色: ${currentIf.charName}。
这是一个正在演进中的 IF 剧情分支出线。
【设定时间】：${currentIf.time}
【设定基调】：${currentIf.tone}
【额外强制指令】：${currentIf.extra}

【挂载的世界书世界观设定】：
${wbCombined}

【剧情与对话往期历史】：
${historyText}

请在当前“线上对话”模式下，以【第一人称】口吻撰写你作为角色 ${currentIf.charName} 此时此刻最符合人设和当下心境的对话回复。直接输出台词，不要输出任何旁白或动作描写。`;
          } else {
            systemPrompt = `你是一个高级的小说剧情续写引擎。正在为角色 ${currentIf.charName} 与用户共同编写分支剧情。
【设定时间】：${currentIf.time}
【设定基调】：${currentIf.tone}
【额外强制指令】：${currentIf.extra}

【挂载的世界书世界观设定】：
${wbCombined}

【剧情与对话往期历史】：
${historyText}

请在当前“线下叙事”模式下，继续编写下一阶段的小说长文故事推进。
要求：使用第三人称指代 ${currentIf.charName}，第二人称“你”指代用户。进行深度的情景叙事，推进你们的关系或当前冲突。不要输出任何题外话或前言旁白。`;
          }

          const response = await currentRoche.ai.chat({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "请根据上述指令进行后续创作。" }
            ],
            temperature: 0.8
          });

          const replyText = response.text || "AI 续写引擎发生阻断，未返回有效信息。";

          currentIf.messages.push({
            role: "assistant",
            text: replyText,
            mode: currentIf.mode,
            timestamp: Date.now()
          });

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
        // 加载当前可挂载的世界书
        try {
          const wbs = await currentRoche.worldbook.list() || [];
          state.detailsState.worldbooks = wbs;
        } catch (e) {
          console.error(e);
        }
        state.showingDetails = true;
        state.detailsState.summaryResult = "";
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

    // 勾选世界书挂载
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

    // 跨段总结
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

        state.isGenerating = true;
        render();

        try {
          // 截取特定段落
          const segmentText = currentIf.messages.slice(fromVal - 1, toVal).map((m, i) => {
            const num = fromVal + i;
            const sender = m.role === "user" ? "用户" : currentIf.charName;
            return `[第 ${num} 段] ${sender}: ${m.text}`;
          }).join("\n\n");

          const response = await currentRoche.ai.chat({
            messages: [
              {
                role: "system",
                content: `请对以下指定区间的剧情记录进行高度精简、连贯生动的概要总结（150字左右），注意不漏掉关键的人物情感和事件转变：\n\n${segmentText}`
              }
            ],
            temperature: 0.7
          });

          state.detailsState.sumFrom = fromVal;
          state.detailsState.sumTo = toVal;
          state.detailsState.summaryResult = response.text || "总结生成失败";
        } catch (e) {
          console.error(e);
          currentRoche.ui.toast("总结获取失败");
        } finally {
          state.isGenerating = false;
          render();
        }
      };
    }

    // 结束此 IF 线并归档
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
            // 移出进行中列表
            state.activeIfLines = state.activeIfLines.filter(x => x.id !== currentIf.id);
            // 压入已结束列表
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
    const endedIfCards = pluginContainer.querySelectorAll(".se-if-card");
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

    // 生成总结并注入主记忆
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
                content: `请将以下在平行 IF 出线里发生的事件、人物心路变化及交流，提炼成一段高度精简的、用于注入用户长期记忆库中的“事实总结（Fact Memory）”。
要求：以事实性的陈述句描述（150字内）。
例如：“在一条平行分支线中，用户与沈砚在深夜的大雨中长谈，解开了过去的误会，彼此心灵更加贴近，决定未来共同面对危机。”

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
            message: `以下为生成的记忆事实描述：\n\n"${memorySummary}"\n\n【注意】：此数据将永久写入 Roche 宿主此角色的主 facts 记忆库中。卸载插件时，已写入的记忆将“不会”被删除。确认注入吗？`
          });

          if (ok) {
            await currentRoche.memory.write({
              conversationId: endedIf.conversationId,
              summaryText: memorySummary,
              who: ["用户", endedIf.charName],
              action: "在分支时间线中发生深度互动，促进了关系发展",
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

  // 注册到 Roche 宿主
  window.RochePlugin.register({
    id: "roche-story-engine",
    name: "剧情引擎",
    version: "1.0.0",
    apps: [
      {
        id: "roche-story-engine-home",
        name: "剧情引擎",
        icon: "extension",
        iconImage: "",
        async mount(container, roche) {
          currentRoche = roche;
          pluginContainer = container;

          // 1. 动态插入局部样式
          const styleId = "se-plugin-style";
          let styleEl = document.getElementById(styleId);
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            styleEl.innerHTML = `
              /* 极致现代简约黑暗风样式表，完美避免全局污染 */
              .roche-plugin-story-engine {
                --se-bg: #09090b;
                --se-surface: #18181b;
                --se-border: #27272a;
                --se-text: #f4f4f5;
                --se-text-muted: #a1a1aa;
                --se-primary: #6366f1;
                --se-primary-hover: #4f46e5;
                --se-danger: #ef4444;
                --se-success: #10b981;
                --se-input-bg: #09090b;
                
                display: flex;
                flex-direction: column;
                height: 100%;
                background-color: var(--se-bg);
                color: var(--se-text);
                font-family: system-ui, -apple-system, sans-serif;
                position: relative;
                overflow: hidden;
              }

              /* 顶栏与状态过渡 */
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
                background: linear-gradient(90deg, #18181b 0%, #312e81 50%, #18181b 100%);
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

              /* 主滚动视口 */
              .se-main {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
              }

              /* 简约面板与卡片 */
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

              /* 对话与卡片列表 */
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
                background-color: #242427;
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
              .se-if-card {
                padding: 16px;
                border: 1px solid var(--se-border);
                border-radius: 8px;
                background-color: var(--se-surface);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              .se-if-card:hover {
                background-color: #242427;
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

              /* 新建表单 */
              .se-form-container {
                display: flex;
                flex-direction: column;
                height: 100%;
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
                background-color: var(--se-input-bg);
                border: 1px solid var(--se-border);
                border-radius: 6px;
                padding: 10px;
                color: var(--se-text);
                font-size: 14px;
                outline: none;
              }
              .se-form-group input:focus, .se-form-group select:focus, .se-form-group textarea:focus {
                border-color: var(--se-primary);
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
                padding-bottom: 12px;
                margin-bottom: 12px;
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
                background-color: var(--se-bg);
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
              }
              .se-chat-messages {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding-right: 4px;
                margin-bottom: 12px;
              }

              /* 线上气泡气泡样式 */
              .se-bubble-wrapper {
                display: flex;
                flex-direction: column;
                max-width: 80%;
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
                opacity: 0.6;
              }
              .se-bubble-box {
                background-color: var(--se-surface);
                border: 1px solid var(--se-border);
                padding: 10px 14px;
                border-radius: 12px;
                font-size: 14px;
                line-height: 1.5;
                word-break: break-all;
              }
              .se-bubble-right .se-bubble-box {
                background-color: var(--se-primary);
                border-color: var(--se-primary);
              }

              /* 线下文学创作样式 */
              .se-narrative-block {
                padding: 16px;
                background-color: #0c0a09;
                border-left: 3px solid var(--se-primary);
                margin: 4px 0;
                border-radius: 0 8px 8px 0;
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
                color: #e4e4e7;
                letter-spacing: 0.5px;
              }

              /* 底部输入框 */
              .se-chat-footer {
                display: flex;
                flex-direction: column;
                gap: 8px;
                border-top: 1px solid var(--se-border);
                padding-top: 12px;
              }
              .se-chat-footer textarea {
                background-color: var(--se-surface);
                border: 1px solid var(--se-border);
                border-radius: 6px;
                padding: 10px;
                color: var(--se-text);
                font-size: 13px;
                resize: none;
                outline: none;
              }
              .se-chat-footer-actions {
                display: flex;
                gap: 8px;
              }

              /* 极简基础按钮 */
              .se-btn-primary, .se-btn-secondary, .se-btn-danger {
                padding: 10px 16px;
                font-size: 13px;
                font-weight: 600;
                border-radius: 6px;
                cursor: pointer;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: opacity 0.2s;
              }
              .se-btn-primary { background-color: var(--se-primary); color: #fff; }
              .se-btn-primary:hover { background-color: var(--se-primary-hover); }
              .se-btn-secondary { background-color: var(--se-surface); color: var(--se-text); border: 1px solid var(--se-border); }
              .se-btn-secondary:hover { background-color: #242427; }
              .se-btn-danger { background-color: var(--se-danger); color: #fff; }
              .se-btn-icon { background: none; border: none; color: var(--se-text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; }
              .se-btn-icon:hover { color: var(--se-text); }
              .se-btn-text { background: none; border: none; color: var(--se-primary); cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
              .se-btn-text:hover { opacity: 0.8; }
              button:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }

              /* 世界书多选 */
              .se-wb-selector {
                display: flex;
                flex-direction: column;
                gap: 6px;
                max-height: 120px;
                overflow-y: auto;
                border: 1px solid var(--se-border);
                padding: 8px;
                border-radius: 6px;
              }
              .se-checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                cursor: pointer;
              }

              .se-divider { height: 1px; background-color: var(--se-border); margin: 8px 0; }
              .se-summary-box { background-color: #1c1917; border: 1px dashed var(--se-border); padding: 12px; border-radius: 6px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }

              /* 归档查看 */
              .se-log-box { display: flex; flex-direction: column; gap: 12px; max-height: 320px; overflow-y: auto; border: 1px solid var(--se-border); padding: 10px; border-radius: 6px; }
              .se-log-item { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid var(--se-border); padding-bottom: 8px; }
              .se-log-meta { font-size: 11px; color: var(--se-primary); font-weight: 600; }
              .se-log-text { font-size: 13px; line-height: 1.5; color: #d4d4d8; }

              /* 空白占位 */
              .se-empty { padding: 40px 16px; text-align: center; color: var(--se-text-muted); font-size: 13px; border: 1px dashed var(--se-border); border-radius: 8px; }
              .se-empty-sub { text-align: center; color: var(--se-text-muted); font-size: 12px; padding: 12px 0; }

              /* 全局底部 DOCK 栏 */
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

          // 2. 初始化加载存储数据与对话
          await loadPluginState();
          await syncConversations();

          // 3. 执行首屏渲染
          render();
        },
        async unmount(container, roche) {
          // 彻底清理避免内存泄漏
          if (container) {
            container.replaceChildren();
          }
          currentRoche = null;
          pluginContainer = null;

          // 移除挂载的插件样式表
          const styleEl = document.getElementById("se-plugin-style");
          if (styleEl) styleEl.remove();
        }
      }
    ]
  });
})();