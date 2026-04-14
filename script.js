const STORAGE_KEY = "timetable_app_data";
window.onload = loadData;

document.addEventListener("input", saveData);

let GLOBAL_TIMETABLE = {};

// ================= SAVE =================
function saveData() {
  const data = {
    schoolName: document.getElementById("schoolName").value,
    staff: getStaff(),
    courses: getCourses(),
    times: getTimes(),
    classes: getClasses()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ================= LOAD =================
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const data = JSON.parse(saved);

  document.getElementById("schoolName").value = data.schoolName || "";

  data.classes?.forEach(c => {
    addClass();
    document.querySelector("#classes .item:last-child input").value = c;
  });

  data.staff.forEach(s => {
    addStaff();
    document.querySelector("#staff .item:last-child input").value = s;
  });

  updateStaffDropdowns();

  data.courses.forEach(c => {
    addCourse();
    let last = document.querySelector("#courses .item:last-child");

    last.querySelector("input").value = c.name;
    last.querySelector(".staff-select").value = c.lecturer;
    last.querySelector(".duration").value = c.duration;
  });

  data.times.forEach(t => {
    addTime();
    document.querySelector("#times .item:last-child input").value = t;
  });
}

// ================= HELPERS =================
function createItem(containerId, html) {
  let div = document.createElement("div");
  div.className = "item";
  div.innerHTML = `${html}<button onclick="deleteItem(this)">❌</button>`;
  document.getElementById(containerId).appendChild(div);
}

function deleteItem(btn) {
  btn.parentElement.remove();
  updateStaffDropdowns();
}

// ================= ADD =================
function addClass() {
  createItem("classes", `<input placeholder="Class (e.g Primary 1A)">`);
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
      <option value="2">Double</option>
    </select>
  `);
}

function addTime() {
  createItem("times", `<input placeholder="8:00 - 9:00 or Break">`);
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

          if (time.toLowerCase().includes("break")) {
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

          timetable.push({class:cls, course:course.name, lecturer:course.lecturer, day, time});
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

  let html = `<div id="printArea"><h2>${cls}</h2><table border="1" width="100%">`;

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

  html += `</table></div>`;
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
