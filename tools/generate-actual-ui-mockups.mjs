import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "render_final", "actual_ui_mockups");
mkdirSync(outDir, { recursive: true });

const W = 1440;
const H = 960;

const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const text = (x, y, value, size = 14, weight = 400, fill = "#0f172a", anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
const rect = (x, y, w, h, fill = "#fff", stroke = "#e2e8f0", rx = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x1, y1, x2, y2, stroke = "#e2e8f0") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}"/>`;
const button = (x, y, w, label, primary = true) =>
  `${rect(x, y, w, 40, primary ? "#2563eb" : "#ffffff", primary ? "#2563eb" : "#dbe3ee", 8)}${text(x + w / 2, y + 26, label, 14, 600, primary ? "#fff" : "#334155", "middle")}`;
const input = (x, y, w, label, value = "") =>
  `${text(x, y, label, 14, 500, "#334155")}${rect(x, y + 12, w, 42, "#fff", "#dbe3ee", 8)}${value ? text(x + 14, y + 39, value, 14, 400, "#64748b") : ""}`;
const badge = (x, y, label, fill, color, w = 112) =>
  `${rect(x, y, w, 28, fill, color.replace(")", ", .25)").replace("rgb", "rgba"), 14)}${text(x + w / 2, y + 19, label, 13, 600, color, "middle")}`;

function svg(title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <title>${esc(title)}</title>
  <rect width="${W}" height="${H}" fill="#f8fafc"/>
  ${body}
</svg>
`;
}

function iconBox(x, y, size = 40) {
  return `${rect(x, y, size, size, "#eff6ff", "#bfdbfe", 12)}<path d="M${x + size / 2} ${y + 12} L${x + size / 2 + 10} ${y + 17} V${y + 27} C${x + size / 2 + 10} ${y + 34} ${x + size / 2 + 4} ${y + 37} ${x + size / 2} ${y + 39} C${x + size / 2 - 4} ${y + 37} ${x + size / 2 - 10} ${y + 34} ${x + size / 2 - 10} ${y + 27} V${y + 17} L${x + size / 2} ${y + 12}Z" stroke="#2563eb" stroke-width="2.5" fill="none"/>`;
}

function sidebar(active = "Главная", role = "hr") {
  const items = role === "director"
    ? ["Главная", "Документы"]
    : ["Главная", "Сотрудники", "Документы", "Создать документ", "Шаблоны"];
  let y = 154;
  const rows = items.map((item) => {
    const isActive = item === active;
    const out = `
      ${rect(14, y - 24, 232, 44, isActive ? "#eff6ff" : "#ffffff", isActive ? "#dbeafe" : "#ffffff", 8)}
      <circle cx="38" cy="${y - 2}" r="7" fill="${isActive ? "#2563eb" : "#94a3b8"}"/>
      ${text(58, y + 3, item, 14, isActive ? 700 : 500, isActive ? "#2563eb" : "#64748b")}
    `;
    y += 50;
    return out;
  }).join("");

  return `
    <rect x="0" y="0" width="260" height="${H}" fill="#ffffff"/>
    ${line(260, 0, 260, H)}
    ${iconBox(18, 22, 40)}
    ${text(70, 46, "HR Docs", 14, 800)}
    ${text(70, 64, "СИСТЕМА АВТОМАТИЗАЦИИ", 10, 700, "#64748b")}
    ${text(18, 118, "УПРАВЛЕНИЕ", 12, 700, "#94a3b8")}
    ${rows}
    ${line(0, 842, 260, 842)}
    <circle cx="36" cy="884" r="17" fill="#eff6ff" stroke="#bfdbfe"/>
    ${text(36, 890, role === "director" ? "di" : "hr", 12, 800, "#2563eb", "middle")}
    ${text(64, 878, role, 14, 600)}
    ${text(64, 899, role === "director" ? "Директор" : "HR-сотрудник", 12, 400, "#64748b")}
  `;
}

function pageHeader(title, subtitle, icon = true) {
  return `
    ${icon ? '<circle cx="322" cy="58" r="16" fill="#2563eb"/>' : ""}
    ${text(icon ? 352 : 304, 66, title, 30, 800)}
    ${text(304, 96, subtitle, 15, 400, "#64748b")}
  `;
}

function stat(x, y, label, value, tint = "#2563eb") {
  return `
    ${rect(x, y, 246, 132, "#ffffff", "#e2e8f0", 12)}
    <circle cx="${x + 204}" cy="${y + 36}" r="20" fill="${tint}18"/>
    <circle cx="${x + 204}" cy="${y + 36}" r="8" fill="${tint}"/>
    ${text(x + 24, y + 42, label, 13, 700, "#64748b")}
    ${text(x + 24, y + 86, value, 40, 800)}
  `;
}

function table(x, y, widths, headers, rows) {
  const total = widths.reduce((s, n) => s + n, 0);
  let out = `${rect(x, y, total, 58 + rows.length * 58, "#ffffff", "#e2e8f0", 10)}
    <rect x="${x}" y="${y}" width="${total}" height="58" rx="10" fill="#f1f5f9"/>
    ${line(x, y + 58, x + total, y + 58)}`;
  let cx = x;
  headers.forEach((h, i) => {
    out += text(cx + 22, y + 37, h, 12, 800, "#64748b");
    cx += widths[i];
  });
  rows.forEach((row, i) => {
    const ry = y + 58 + i * 58;
    cx = x;
    out += line(x, ry + 58, x + total, ry + 58);
    row.forEach((cell, j) => {
      out += typeof cell === "function" ? cell(cx + 22, ry + 16) : text(cx + 22, ry + 36, cell, 14, j === 0 ? 700 : 500, j === 0 ? "#0f172a" : "#475569");
      cx += widths[j];
    });
  });
  return out;
}

const files = [
  ["01-login-real.svg", svg("Реальный макет: вход", `
    <rect width="${W}" height="${H}" fill="#f8fafc"/>
    <path d="M0 0 H1440 V960 H0 Z" fill="url(#loginGrad)"/>
    <defs><linearGradient id="loginGrad" x1="0" y1="0" x2="1440" y2="960"><stop stop-color="#f8fafc"/><stop offset=".7" stop-color="#f8fafc"/><stop offset="1" stop-color="#eff6ff"/></linearGradient></defs>
    <g transform="translate(470 96)">
      ${iconBox(200, 0, 64)}
      ${text(250, 130, "Вход в систему", 30, 800, "#0f172a", "middle")}
      ${text(250, 164, "Автоматизация HR-документов", 18, 400, "#64748b", "middle")}
      ${rect(0, 214, 500, 474, "#ffffff", "#e2e8f0", 14)}
      ${input(32, 272, 436, "Имя пользователя", "hr")}
      ${input(32, 370, 436, "Пароль", "••••••")}
      ${rect(32, 468, 436, 48, "#fee2e2", "#fca5a5", 8)}${text(50, 499, "Ошибка входа", 16, 400, "#ef4444")}
      ${button(32, 550, 436, "Войти")}
      ${line(32, 622, 468, 622)}
      ${text(250, 660, "Демо-доступ для двух ролей системы.", 14, 400, "#64748b", "middle")}
      ${text(250, 684, "HR: hr / hr2024", 13, 500, "#334155", "middle")}
      ${text(250, 708, "Директор: director / director2024", 13, 500, "#334155", "middle")}
      ${text(250, 762, "Система автоматизации формирования и печати документов", 13, 400, "#64748b", "middle")}
    </g>
  `)],
  ["02-dashboard-real.svg", svg("Реальный макет: обзор", `
    ${sidebar("Главная")}
    ${pageHeader("Обзор системы", "Оперативная сводка по документам и сотрудникам", false)}
    ${button(1034, 44, 142, "Сотрудники", false)}
    ${button(1194, 44, 184, "Создать документ")}
    ${stat(304, 142, "ВСЕГО ДОКУМЕНТОВ", "58", "#2563eb")}
    ${stat(574, 142, "НА ПОДПИСЬ", "7", "#eab308")}
    ${stat(844, 142, "ПОДПИСАНО", "43", "#16a34a")}
    ${stat(1114, 142, "СОТРУДНИКОВ", "24", "#2563eb")}
    ${rect(304, 322, 1074, 438, "#ffffff", "#e2e8f0", 12)}
    <rect x="304" y="322" width="1074" height="64" rx="12" fill="#f1f5f9"/>
    ${text(336, 362, "Последние документы", 18, 700)}
    ${text(1260, 362, "Смотреть все →", 14, 600, "#64748b")}
    ${table(304, 386, [170, 310, 230, 180, 184], ["НОМЕР", "НАЗВАНИЕ", "СОТРУДНИК", "СТАТУС", "ДАТА СОЗДАНИЯ"], [
      ["HR-2026-014", "Приказ о приеме", "Иванов И.И.", (x,y)=>badge(x,y,"На подписи","#faf5ff","rgb(126 34 206)",126), "15.06.2026"],
      ["HR-2026-013", "Трудовой договор", "Петрова А.А.", (x,y)=>badge(x,y,"Черновик","#fefce8","rgb(161 98 7)",108), "14.06.2026"],
      ["HR-2026-012", "Приказ о переводе", "Орлова М.С.", (x,y)=>badge(x,y,"Подписан","#f0fdf4","rgb(21 128 61)",104), "12.06.2026"],
      ["HR-2026-011", "Заявление", "Сидоров П.П.", (x,y)=>badge(x,y,"Напечатан","#eff6ff","rgb(29 78 216)",116), "10.06.2026"]
    ])}
  `)],
  ["03-employees-real.svg", svg("Реальный макет: сотрудники", `
    ${sidebar("Сотрудники")}
    ${pageHeader("Штат сотрудников", "Управление персоналом и контактными данными")}
    ${button(1164, 44, 214, "Добавить сотрудника")}
    ${rect(304, 138, 1074, 620, "#ffffff", "#e2e8f0", 12)}
    <rect x="304" y="138" width="1074" height="76" rx="12" fill="#f8fafc"/>
    ${rect(328, 156, 450, 40, "#ffffff", "#dbe3ee", 8)}
    ${text(360, 181, "Поиск по ФИО, отделу или должности...", 14, 400, "#64748b")}
    ${table(304, 214, [275, 270, 260, 150, 119], ["СОТРУДНИК", "ДОЛЖНОСТЬ / ОТДЕЛ", "КОНТАКТЫ", "ПРИНЯТ", "ДЕЙСТВИЯ"], [
      [(x,y)=>`<circle cx="${x+20}" cy="${y+14}" r="18" fill="#eff6ff" stroke="#bfdbfe"/>${text(x+20,y+20,"И",14,800,"#2563eb","middle")}${text(x+50,y+10,"Иванов Иван Иванович",14,700)}${text(x+50,y+32,"EMP-001",12,500,"#64748b")}`, "HR-специалист / Кадры", "ivanov@company.ru", "15.06.2026", "⋮"],
      [(x,y)=>`<circle cx="${x+20}" cy="${y+14}" r="18" fill="#eff6ff" stroke="#bfdbfe"/>${text(x+20,y+20,"П",14,800,"#2563eb","middle")}${text(x+50,y+10,"Петрова Анна",14,700)}${text(x+50,y+32,"EMP-002",12,500,"#64748b")}`, "Бухгалтер / Финансы", "petrova@company.ru", "03.04.2025", "⋮"],
      [(x,y)=>`<circle cx="${x+20}" cy="${y+14}" r="18" fill="#eff6ff" stroke="#bfdbfe"/>${text(x+20,y+20,"С",14,800,"#2563eb","middle")}${text(x+50,y+10,"Сидоров Павел",14,700)}${text(x+50,y+32,"EMP-003",12,500,"#64748b")}`, "Менеджер / Продажи", "+7 900 000-00-00", "18.02.2024", "⋮"]
    ])}
    ${rect(458, 636, 766, 210, "#ffffff", "#e2e8f0", 12)}
    ${text(490, 676, "Новый сотрудник", 22, 700)}
    ${input(490, 720, 340, "ФИО полностью", "Иванов Иван Иванович")}
    ${input(858, 720, 160, "Дата приёма", "2026-06-15")}
    ${text(858, 794, "min: 1900-01-01, max: 2100-12-31", 12, 500, "#64748b")}
    ${button(1040, 774, 148, "Добавить")}
  `)],
  ["04-documents-real.svg", svg("Реальный макет: реестр документов", `
    ${sidebar("Документы")}
    ${pageHeader("Реестр документов", "Архив приказов, договоров и актов")}
    ${button(1172, 44, 206, "Создать документ")}
    ${rect(304, 138, 1074, 650, "#ffffff", "#e2e8f0", 12)}
    <rect x="304" y="138" width="1074" height="76" rx="12" fill="#f8fafc"/>
    ${rect(328, 156, 610, 40, "#ffffff", "#dbe3ee", 8)}
    ${text(360, 181, "Поиск по номеру, названию или ФИО...", 14, 400, "#64748b")}
    ${rect(1002, 156, 240, 40, "#ffffff", "#dbe3ee", 8)}
    ${text(1032, 181, "Все статусы", 14, 500, "#334155")}
    ${table(304, 214, [260, 230, 190, 150, 145, 99], ["ДОКУМЕНТ", "СОТРУДНИК", "ТИП", "СТАТУС", "СОЗДАН", "ДЕЙСТВИЯ"], [
      [(x,y)=>`${text(x,y+8,"Приказ о приеме",14,700)}${text(x,y+32,"HR-2026-014",12,500,"#64748b")}`, "Иванов И.И.", "Приказ", (x,y)=>badge(x,y,"На подписи","#faf5ff","rgb(126 34 206)",126), "15.06.2026", "Открыть"],
      [(x,y)=>`${text(x,y+8,"Трудовой договор",14,700)}${text(x,y+32,"HR-2026-013",12,500,"#64748b")}`, "Петрова А.А.", "Договор", (x,y)=>badge(x,y,"Черновик","#fefce8","rgb(161 98 7)",108), "14.06.2026", "Открыть"],
      [(x,y)=>`${text(x,y+8,"Приказ о переводе",14,700)}${text(x,y+32,"HR-2026-012",12,500,"#64748b")}`, "Орлова М.С.", "Приказ", (x,y)=>badge(x,y,"Подписан","#f0fdf4","rgb(21 128 61)",104), "12.06.2026", "Открыть"]
    ])}
  `)],
  ["05-create-document-real.svg", svg("Реальный макет: создание документа", `
    ${sidebar("Создать документ")}
    <g transform="translate(260 0)">
      <circle cx="590" cy="84" r="32" fill="#eff6ff" stroke="#bfdbfe"/>
      ${text(590, 146, "Создание документа", 30, 800, "#0f172a", "middle")}
      ${text(590, 176, "Мастер формирования нового документа по шаблону", 15, 400, "#64748b", "middle")}
      <circle cx="404" cy="250" r="20" fill="#2563eb"/><circle cx="590" cy="250" r="20" fill="#eff6ff" stroke="#2563eb"/><circle cx="776" cy="250" r="20" fill="#ffffff" stroke="#dbe3ee"/>
      ${line(424,250,570,250,"#93c5fd")}${line(610,250,756,250)}
      ${text(404, 286, "Шаблон", 14, 600, "#0f172a", "middle")}${text(590, 286, "Сотрудник", 14, 600, "#0f172a", "middle")}${text(776, 286, "Данные", 14, 500, "#64748b", "middle")}
      ${rect(240, 330, 700, 410, "#ffffff", "#e2e8f0", 12)}
      ${text(280, 382, "Выберите тип документа", 20, 700)}
      ${line(280, 404, 900, 404)}
      ${rect(280, 438, 292, 110, "#eff6ff", "#93c5fd", 12)}
      ${text(344, 478, "Приказ о приеме", 16, 700)}
      ${text(344, 506, "Создание кадрового приказа", 13, 400, "#64748b")}
      ${rect(596, 438, 292, 110, "#ffffff", "#e2e8f0", 12)}
      ${text(660, 478, "Трудовой договор", 16, 700)}
      ${text(660, 506, "Формирование договора", 13, 400, "#64748b")}
      ${button(760, 650, 128, "Далее")}
    </g>
  `)],
  ["06-document-view-real.svg", svg("Реальный макет: просмотр документа", `
    ${sidebar("Документы", "director")}
    ${button(304, 34, 190, "← Реестр документов", false)}
    ${button(1018, 34, 122, "Печать", false)}
    ${button(1158, 34, 220, "Подписать документ")}
    ${rect(304, 96, 790, 798, "#ffffff", "#e5e7eb", 8)}
    ${text(699, 178, "ПРИКАЗ О ПРИЕМЕ", 26, 800, "#000", "middle")}
    ${text(699, 210, "№ HR-2026-014 от 15.06.2026", 14, 400, "#475569", "middle")}
    ${line(374, 246, 1024, 246, "#111827")}
    ${text(374, 306, "Принять Иванова Ивана Ивановича на должность HR-специалиста", 18, 400, "#111827")}
    ${line(374, 350, 1024, 350, "#cbd5e1")}
    ${line(374, 398, 1024, 398, "#cbd5e1")}
    ${line(374, 446, 1024, 446, "#cbd5e1")}
    ${line(374, 494, 1024, 494, "#cbd5e1")}
    ${line(374, 542, 1024, 542, "#cbd5e1")}
    ${line(374, 590, 1024, 590, "#cbd5e1")}
    ${line(374, 658, 1024, 658, "#cbd5e1")}
    ${text(374, 730, "РАБОТОДАТЕЛЬ:", 16, 800, "#111827")}
    ${text(714, 730, "РАБОТНИК:", 16, 800, "#111827")}
    ${line(374, 790, 614, 790, "#111827")}${line(714, 790, 1024, 790, "#111827")}
    <path d="M404 778 C450 730 484 812 534 762 C570 728 600 784 626 752" stroke="#111827" stroke-width="3" fill="none"/>
    ${text(494, 820, "Директор / подпись", 13, 400, "#64748b", "middle")}
    ${text(870, 820, "подпись / расшифровка", 13, 400, "#64748b", "middle")}
    ${rect(1124, 96, 254, 244, "#ffffff", "#e2e8f0", 12)}
    ${text(1154, 136, "Атрибуты", 17, 700)}
    ${text(1154, 184, "Номер", 13, 400, "#64748b")}${text(1154, 208, "HR-2026-014", 14, 700)}
    ${text(1154, 250, "Сотрудник", 13, 400, "#64748b")}${text(1154, 274, "Иванов И.И.", 14, 700)}
    ${badge(1154, 300, "На подписи", "#faf5ff", "rgb(126 34 206)", 126)}
    ${rect(1124, 366, 254, 288, "#ffffff", "#e2e8f0", 12)}
    ${text(1154, 406, "Подпись директора", 17, 700)}
    ${input(1154, 450, 194, "Расшифровка", "Директор")}
    ${rect(1154, 546, 194, 58, "#ffffff", "#dbe3ee", 8)}
    <path d="M1180 582 C1210 550 1230 604 1262 570 C1286 544 1308 590 1330 562" stroke="#111827" stroke-width="3" fill="none"/>
    ${button(1154, 626, 94, "Загрузить", false)}${button(1260, 626, 88, "Очистить", false)}
  `)]
];

for (const [name, content] of files) {
  writeFileSync(join(outDir, name), content, "utf8");
}

writeFileSync(join(outDir, "README.txt"), `Эти макеты сделаны ближе к фактическому интерфейсу приложения HR Document Automator.

Формат: SVG, 1440 x 960 px.
Импорт в Figma: перетащить SVG-файлы на холст или использовать File -> Place image.

В отличие от концептуального набора design_mockups, этот комплект повторяет реальные элементы:
- экран входа с демо-доступом для HR и директора;
- боковое меню HR Docs;
- страницу "Обзор системы";
- таблицы сотрудников и документов;
- мастер создания документа;
- просмотр документа с панелью атрибутов и подписью директора.
`, "utf8");

console.log(`Generated ${files.length} actual UI mockups in ${outDir}`);
