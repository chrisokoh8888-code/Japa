// ================= GLOBAL =================
const STORAGE_KEY = "timetable_app_data";
let GLOBAL_TIMETABLE = {};
let SCHOOL_LOGO = "";

window.onload = loadData;
document.addEventListener("input", saveData);

// ================= SAVE =================
function saveData() {

  const file = document.getElementById("schoolLogo").files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function () {
      const data = buildSaveData(reader.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      SCHOOL_LOGO = reader.result;
    };

    reader.readAsDataURL(file);
  } else {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const data = buildSaveData(existing.logo || "");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    SCHOOL_LOGO = existing.logo || "";
  }
}

function buildSaveData(logo) {
  return {
    schoolName: document.getElementById("schoolName").value,
    logo,
    type: document.getElementById("institutionType").value,
    staff: getStaff(),
    courses: getCourses(),
    times: getTimes(),
    classes: getClasses()
  };
}

// ================= LOAD =================
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const data = JSON.parse(saved);

  document.getElementById("schoolName").value = data.schoolName || "";
  document.getElementById("institutionType").value = data.type || "";
  document.getElementById("institutionType").dispatchEvent(new Event("change"));

  SCHOOL_LOGO = data.logo || "";

  data.classes?.forEach(c => {
    addClass();
    document.querySelector("#classes .item:last-child input").value = c;
  });

  data.staff?.forEach(s => {
    addStaff();
    document.querySelector("#staff .item:last-child input").value = s;
  });

  updateStaffDropdowns();

  data.courses?.forEach(c => {
    addCourse();
    let last = document.querySelector("#courses .item:last-child");

    last.querySelector("input").value = c.name;
    last.querySelector(".staff-select").value = c.lecturer;
    last.querySelector(".duration").value = c.duration;
  });

  data.times?.forEach(t => {
    addTime();
    document.querySelector("#times .item:last-child input").value = t;
  });
}

// ================= STRUCTURE =================
document.getElementById("institutionType").addEventListener("change", function () {

  let type = this.value;
  let html = "";

  if (["nursery","primary","secondary"].includes(type)) {
    html = `
      <h3>🏫 Classes</h3>
      <div id="classes"></div>
      <button class="add-btn" onclick="addClass()">+ Add Class</button>
    `;
  }

  if (["college","polytechnic","university"].includes(type)) {
    html = `
      <h3>🏛️ Faculties</h3>
      <div id="faculties"></div>
      <button class="add-btn" onclick="addFaculty()">+ Add Faculty</button>

      <h3>📚 Departments</h3>
      <div id="departments"></div>
      <button class="add-btn" onclick="addDepartment()">+ Add Department</button>

      <h3>🎓 Levels / Classes</h3>
      <div id="classes"></div>
      <button class="add-btn" onclick="addClass()">+ Add Level</button>
    `;
  }

  document.getElementById("structureSection").innerHTML = html;
});

// ================= HELPERS =================
function createItem(containerId, html) {
  let div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    ${html}
    <button onclick="editItem(this)">✏️</button>
    <button onclick="deleteItem(this)">❌</button>
  `;

  document.getElementById(containerId).appendChild(div);
}

function deleteItem(btn) {
  btn.parentElement.remove();
  updateStaffDropdowns();
}

function editItem(btn) {
  btn.parentElement.querySelectorAll("input").forEach(i => {
    i.disabled = !i.disabled;
  });
}

// ================= ADD =================
function addClass() {
  createItem("classes", `<input placeholder="Class (e.g Primary 1A)">`);
}

function addFaculty() {
  createItem("faculties", `<input placeholder="Faculty">`);
}

function addDepartment() {
  createItem("departments", `<input placeholder="Department">`);
}

function addStaff() {
  createItem("staff", `<input placeholder="Staff Name">`);
  updateStaffDropdowns();
}

function addCourse() {
  let options = getStaff().map(s => `<option>${s}</option>`).join("");

  createItem("courses", `
    <input placeholder="Course Name">
    <select class="staff-select">${options}</select>
    <select class="duration">
      <option value="1">1 Period</option>
      <option value="2">Double Period</option>
    </select>
  `);
}

function addTime() {
  createItem("times", `<input placeholder="e.g 8:00 - 9:00 OR Break">`);
}

// ================= DATA =================
function getClasses() {
  return Array.from(document.querySelectorAll("#classes .item input"))
    .map(i => i.value).filter(v => v);
}

function getStaff() {
  return Array.from(document.querySelectorAll("#staff .item input"))
    .map(i => i.value).filter(v => v);
}

function updateStaffDropdowns() {
  let staff = getStaff();
  document.querySelectorAll(".staff-select").forEach(select => {
    select.innerHTML = staff.map(s => `<option>${s}</option>`).join("");
  });
}

function getCourses() {
  return Array.from(document.querySelectorAll("#courses .item")).map(item => ({
    name: item.querySelector("input").value,
    lecturer: item.querySelector(".staff-select").value,
    duration: parseInt(item.querySelector(".duration").value)
  }));
}

function getTimes() {
  return Array.from(document.querySelectorAll("#times .item input"))
    .map(i => i.value).filter(v => v);
}

// ================= ENGINE =================
function buildTimetable(data) {

  let result = {};

  data.classes.forEach(cls => {

    let timetable = [];
    let used = {};
    let dayIndex = 0;

    data.courses.forEach(course => {

      let assigned = false;

      while (!assigned) {

        let day = data.days[dayIndex % data.days.length];

        for (let i = 0; i < data.times.length; i++) {

          let time = data.times[i];

          if (time.toLowerCase().includes("break") ||
              time.toLowerCase().includes("lunch") ||
              time.toLowerCase().includes("closing")) {

            timetable.push({class:cls, course:time, day, time});
            continue;
          }

          let key = `${course.lecturer}-${day}-${time}`;
          if (used[key]) continue;

          if (course.duration === 2) {
            let next = data.times[i + 1];
            if (!next) continue;

            timetable.push({class:cls, course:course.name, day, time});
            timetable.push({class:cls, course:course.name, day, time:next});

            used[key] = true;
            assigned = true;
            break;
          }

          timetable.push({
            class:cls,
            course:course.name,
            lecturer:course.lecturer,
            day,
            time
          });

          used[key] = true;
          assigned = true;
          break;
        }

        dayIndex++;
      }

    });

    result[cls] = timetable;
  });

  return result;
}

// ================= DISPLAY =================
function displayTimetable(data) {

  GLOBAL_TIMETABLE = data;

  let selector = document.getElementById("classSelector");
  selector.innerHTML = Object.keys(data).map(c => `<option>${c}</option>`).join("");

  renderClass(selector.value || Object.keys(data)[0]);
  renderWorkload(data);
}

function renderClass(cls) {

  const output = document.getElementById("output");
  const times = getTimes();
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const schoolName = document.getElementById("schoolName").value;

  let html = `<div id="printArea">`;

  html += `
  <div style="text-align:center;">
    ${SCHOOL_LOGO ? `<img src="${SCHOOL_LOGO}" style="height:60px;"><br>` : ""}
    <h2>${schoolName}</h2>
  </div>
  `;

  html += `<h3>${cls}</h3>`;

  html += `<table border="1" width="100%">`;
  html += `<tr><th>Day</th>`;
  times.forEach(t => html += `<th>${t}</th>`);
  html += `</tr>`;

  days.forEach(day => {
    html += `<tr><td>${day}</td>`;

    times.forEach(time => {
      let entry = GLOBAL_TIMETABLE[cls].find(t => t.day === day && t.time === time);
      html += `<td>${entry?.course || "—"}</td>`;
    });

    html += `</tr>`;
  });

  html += `</table>`;

  html += `
  <div style="text-align:center; margin-top:20px; font-size:12px;">
    <b>Powered by Timetable Master NG</b><br>
    Afri e-Business Solutions Ltd<br>
    <i>Solving the Complex. Innovating the Future</i><br>
    https://afri-ebusiness-solutions.netlify.app/
  </div>`;

  html += `</div>`;

  output.innerHTML = html;
}

// ================= WORKLOAD =================
function renderWorkload(data) {

  let counts = {};

  Object.values(data).flat().forEach(item => {
    if (!item.lecturer) return;
    counts[item.lecturer] = (counts[item.lecturer] || 0) + 1;
  });

  let html = "<ul>";
  Object.keys(counts).forEach(t => {
    html += `<li>${t}: ${counts[t]} periods</li>`;
  });
  html += "</ul>";

  document.getElementById("workload").innerHTML = html;
}

// ================= EVENTS =================
document.getElementById("classSelector").addEventListener("change", function () {
  renderClass(this.value);
});

// ================= PRINT =================
function printTimetable() {
  window.print();
}

function downloadPDF() {
  window.print();
}

// ================= GENERATE =================
function generate() {

  const data = {
    classes: getClasses(),
    courses: getCourses(),
    times: getTimes(),
    days: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  };

  const timetable = buildTimetable(data);
  displayTimetable(timetable);
}
