import type { ScanResult } from "../types.js";
import { getLabelColor } from "../scorer/scorer.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#eab308";
    case "low": return "#3b82f6";
    default: return "#6b7280";
  }
}

function gaugeColor(score: number): string {
  const label = getLabelColor(score);
  switch (label) {
    case "green": return "#22c55e";
    case "blue": return "#3b82f6";
    case "yellow": return "#eab308";
    case "orange": return "#f97316";
    case "red": return "#ef4444";
    default: return "#6b7280";
  }
}

export function formatHtml(result: ScanResult): string {
  const gc = gaugeColor(result.score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (result.score / 100) * circumference;

  const critical = result.findings.filter((f) => f.severity === "critical").length;
  const high = result.findings.filter((f) => f.severity === "high").length;
  const medium = result.findings.filter((f) => f.severity === "medium").length;
  const low = result.findings.filter((f) => f.severity === "low").length;

  const findingsHtml = result.findings
    .map(
      (f, i) => `
    <div class="finding" data-severity="${f.severity}">
      <div class="finding-header" onclick="this.parentElement.classList.toggle('open')">
        <span class="badge" style="background:${severityColor(f.severity)}">${f.severity.toUpperCase()}</span>
        <span class="finding-title">${escapeHtml(f.description)}</span>
        <span class="chevron">&#9660;</span>
      </div>
      <div class="finding-body">
        <p><strong>Provider:</strong> ${escapeHtml(f.provider)}</p>
        <p><strong>File:</strong> ${escapeHtml(f.file)}:${f.line}</p>
        <p><strong>Found:</strong> <code>${escapeHtml(f.context)}</code></p>
        <div class="fix-guide">
          <strong>How to Fix:</strong>
          <p>${escapeHtml(f.recommendation)}</p>
        </div>
      </div>
    </div>`
    )
    .join("\n");

  const auditHtml = result.audit
    .map(
      (c) => `
    <div class="audit-check ${c.passed ? "pass" : "fail"}">
      <span class="audit-icon">${c.passed ? "&#10003;" : "&#10007;"}</span>
      <span class="audit-name">${escapeHtml(c.name)}</span>
      ${c.passed ? "" : `<p class="audit-rec">${escapeHtml(c.recommendation)}</p>`}
    </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SecureSecrets Security Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
  .timestamp { color: #94a3b8; margin-bottom: 2rem; }
  .score-section { text-align: center; margin: 2rem 0; }
  .gauge-container { display: inline-block; position: relative; width: 140px; height: 140px; }
  .gauge-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem; font-weight: bold; color: ${gc}; }
  .gauge-label { font-size: 0.8rem; color: #94a3b8; }
  .summary { display: flex; gap: 1rem; justify-content: center; margin: 1.5rem 0; flex-wrap: wrap; }
  .summary-item { padding: 0.5rem 1rem; border-radius: 8px; background: #1e293b; }
  .filters { display: flex; gap: 0.5rem; margin: 1rem 0; flex-wrap: wrap; }
  .filter-btn { padding: 0.4rem 0.8rem; border: 1px solid #334155; border-radius: 6px; background: transparent; color: #e2e8f0; cursor: pointer; }
  .filter-btn.active { background: #334155; }
  .finding { background: #1e293b; border-radius: 8px; margin: 0.5rem 0; overflow: hidden; }
  .finding-header { padding: 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; }
  .finding-header:hover { background: #263548; }
  .badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold; color: white; }
  .finding-title { flex: 1; }
  .chevron { transition: transform 0.2s; font-size: 0.7rem; }
  .finding.open .chevron { transform: rotate(180deg); }
  .finding-body { display: none; padding: 0 1rem 1rem; border-top: 1px solid #334155; }
  .finding.open .finding-body { display: block; padding-top: 1rem; }
  .finding-body p { margin: 0.4rem 0; }
  .finding-body code { background: #334155; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
  .fix-guide { margin-top: 0.8rem; padding: 0.8rem; background: #0f172a; border-radius: 6px; border-left: 3px solid #3b82f6; }
  .audit-section { margin-top: 2rem; }
  .audit-check { padding: 0.75rem 1rem; background: #1e293b; border-radius: 6px; margin: 0.4rem 0; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .audit-check.pass .audit-icon { color: #22c55e; }
  .audit-check.fail .audit-icon { color: #ef4444; }
  .audit-icon { font-size: 1.2rem; font-weight: bold; }
  .audit-rec { width: 100%; padding-left: 2rem; color: #94a3b8; font-size: 0.85rem; }
  .download-section { margin-top: 2rem; display: flex; gap: 1rem; }
  .btn { padding: 0.6rem 1.2rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
  .btn-primary { background: #3b82f6; color: white; }
  @media print { body { background: white; color: black; } .finding { break-inside: avoid; } }
</style>
</head>
<body>
<div class="container">
  <h1>SecureSecrets Security Report</h1>
  <p class="timestamp">${escapeHtml(result.timestamp)}</p>

  <div class="score-section">
    <div class="gauge-container">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#334155" stroke-width="8"/>
        <circle cx="60" cy="60" r="54" fill="none" stroke="${gc}" stroke-width="8"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          stroke-linecap="round" transform="rotate(-90 60 60)">
          <animate attributeName="stroke-dashoffset" from="${circumference}" to="${offset}" dur="1s" fill="freeze"/>
        </circle>
      </svg>
      <div class="gauge-text">
        ${result.score}
        <div class="gauge-label">${escapeHtml(result.scoreLabel)}</div>
      </div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-item" style="border-left:3px solid #ef4444">Critical: ${critical}</div>
    <div class="summary-item" style="border-left:3px solid #f97316">High: ${high}</div>
    <div class="summary-item" style="border-left:3px solid #eab308">Medium: ${medium}</div>
    <div class="summary-item" style="border-left:3px solid #3b82f6">Low: ${low}</div>
    <div class="summary-item">Total: ${result.findings.length}</div>
  </div>

  ${result.findings.length > 0 ? `
  <div class="filters">
    <button class="filter-btn active" onclick="filterFindings('all')">All</button>
    <button class="filter-btn" onclick="filterFindings('critical')">Critical</button>
    <button class="filter-btn" onclick="filterFindings('high')">High</button>
    <button class="filter-btn" onclick="filterFindings('medium')">Medium</button>
    <button class="filter-btn" onclick="filterFindings('low')">Low</button>
  </div>
  <div id="findings">${findingsHtml}</div>
  ` : '<p style="text-align:center;margin:2rem;color:#22c55e;font-size:1.2rem">No secrets found. Your setup looks clean!</p>'}

  ${result.audit.length > 0 ? `
  <div class="audit-section">
    <h2>Audit Checks</h2>
    ${auditHtml}
  </div>
  ` : ""}
</div>
<script>
function filterFindings(severity) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.finding').forEach(f => {
    f.style.display = (severity === 'all' || f.dataset.severity === severity) ? '' : 'none';
  });
}
</script>
</body>
</html>`;
}
