/**
 * 提瓦特终端调试工具 (Teyvat Debug Tool)
 * 用于在移动端等无法查看控制台的环境下捕获并显示关键错误
 */

export function initGlobalErrorHandling() {
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMsg = `[Runtime Error]\nMsg: ${message}\nSrc: ${source}\nPos: ${lineno}:${colno}\nStack: ${error?.stack}`;
    showErrorUI(errorMsg);
    return false;
  };

  window.onunhandledrejection = (event) => {
    const errorMsg = `[Unhandled Promise Rejection]\nReason: ${event.reason}`;
    showErrorUI(errorMsg);
  };

  console.log('✨ 提瓦特终端监控已启动 (Teyvat Monitor Initialized)');
}

export function showErrorUI(message: string) {
  // 防止重复创建
  if (document.getElementById('teyvat-error-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'teyvat-error-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: #0d1b2a;
    color: #ff5f5f;
    padding: 2rem;
    z-index: 10000;
    font-family: monospace;
    font-size: 12px;
    overflow-y: auto;
    white-space: pre-wrap;
    border: 4px solid #ff5f5f;
  `;

  const header = document.createElement('h2');
  header.textContent = '⚠ 提瓦特终端：系统崩溃报告';
  header.style.color = '#c9a55c';
  header.style.marginBottom = '1rem';
  header.style.borderBottom = '1px solid #c9a55c';

  const body = document.createElement('div');
  body.textContent = message;

  const btn = document.createElement('button');
  btn.textContent = '确认并尝试重载 (Reload)';
  btn.style.cssText = `
    margin-top: 2rem;
    padding: 10px 20px;
    background: #c9a55c;
    color: #1b263b;
    border: none;
    cursor: pointer;
    font-weight: bold;
  `;
  btn.onclick = () => window.location.reload();

  overlay.appendChild(header);
  overlay.appendChild(body);
  overlay.appendChild(btn);
  document.body.appendChild(overlay);
}
