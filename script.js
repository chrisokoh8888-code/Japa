const STORAGE_KEY = "timetable_app_data";
window.onload = loadData;

document.addEventListener("input", saveData);

// SAVE
function saveData() {
  const data = {
    type: document.getElementById("institutionType").value,
    schoolName: document.getElementById("schoolName").value,
    staff: getStaff(),
    courses: getCourses(),
    rooms: getRooms(),
    times: getTimes()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// LOAD
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const data = JSON.parse(saved);

  document.getElementById("institutionType").value = data.type;
  document.getElementById("schoolName").value = data.schoolName || "";
  document.getElementById("institutionType").dispatchEvent(new Event("change"));

  data.staff.forEach(s => {
    addStaff();
    document.querySelector("#staff .item:last-child input").value = s;
  });

  updateStaffDropdowns();

  data.courses.forEach(c => {
    addCourse();
    let last = document.querySelector("#courses .item:last-child");

    let inputs = last.querySelectorAll("input");
    inputs[0].value = c.name;
    inputs[1].value = c.code;
    last.querySelector(".staff-select").value = c.lecturer;
    last.querySelector(".type").value = c.type;
  });

  data.rooms.forEach(r => {
    addRoom();
    let last = document.querySelector("#rooms .item:last-child");
    last.querySelector("input").value = r.name;
    last.querySelector("select").value = r.type;
  });

  data.times.forEach(t => {
    addTime();
    document.querySelector("#times .item:last-child input").value = t;
  });
}

// STRUCTURE
document.getElementById("institutionType").addEventListener("change", function () {

  document.getElementById("courses").innerHTML = "";
  document.getElementById("staff").innerHTML = "";
  document.getElementById("rooms").innerHTML = "";
  document.getElementById("times").innerHTML = "";

  let type = this.value;
  let html = "";

  if (["nursery","primary","secondary"].includes(type)) {
    html = `<div id="levels"></div>
      <button class="add-btn" onclick="addLevel()">+ Add Level</button>`;
  }

  if (["college","polytechnic","university"].includes(type)) {
    html = `
      <div id="faculties"></div>
      <button class="add-btn" onclick="addFaculty()">+ Add Faculty</button>
      <div id="departments"></div>
      <button class="add-btn" onclick="addDepartment()">+ Add Department</button>
      <div id="levels"></div>
      <button class="add-btn" onclick="addLevel()">+ Add Level</button>
    `;
  }

  document.getElementById("structureSection").innerHTML = html;
});

// HELPERS
function createItem(containerId, html) {
  let div = document.createElement("div");
  div.className = "item";
  div.innerHTML = `${html}
    <button onclick="editItem(this)">✏️</button>
    <button onclick="deleteItem(this)">❌</button>`;
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

// ADD
function addLevel() { createItem("levels", `<input placeholder="Level">`); }
function addFaculty() { createItem("faculties", `<input placeholder="Faculty">`); }
function addDepartment() { createItem("departments", `<input placeholder="Department">`); }

function addStaff() {
  createItem("staff", `<input placeholder="Staff Name">`);
  updateStaffDropdowns();
}

function addCourse() {
  let options = getStaff().map(s => `<option>${s}</option>`).join("");

  let div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <input placeholder="Course Name">
    <input placeholder="Course Code">
    <select class="staff-select">${options}</select>
    <select class="type">
      <option>Theory</option>
      <option>Lab</option>
      <option>Workshop</option>
    </select>
    <button onclick="editItem(this)">✏️</button>
    <button onclick="deleteItem(this)">❌</button>
  `;

  document.getElementById("courses").appendChild(div);
}

function addRoom() {
  createItem("rooms", `
    <input placeholder="Room Name">
    <select>
      <option>Classroom</option>
      <option>Lecture Hall</option>
      <option>Lab</option>
      <option>Workshop</option>
    </select>
  `);
}

function addTime() {
  createItem("times", `<input placeholder="e.g 8:00 - 9:00 OR Break">`);
}

// DATA
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
    name: item.querySelectorAll("input")[0].value,
    lecturer: item.querySelector(".staff-select").value,
    type: item.querySelector(".type").value
  }));
}

function getRooms() {
  return Array.from(document.querySelectorAll("#rooms .item")).map(item => ({
    name: item.querySelector("input").value
  }));
}

function getTimes() {
  return Array.from(document.querySelectorAll("#times .item input"))
    .map(i => i.value).filter(v => v);
}

// ENGINE
function buildTimetable(data) {

  let timetable = [];
  let used = {};

  for (let c of data.courses) {
    for (let d of data.days) {
      for (let t of data.times) {

        if (t.toLowerCase().includes("break") ||
            t.toLowerCase().includes("lunch") ||
            t.toLowerCase().includes("closing")) {
          timetable.push({ course:t, day:d, time:t });
          continue;
        }

        let key = `${c.lecturer}-${d}-${t}`;
        if (used[key]) continue;

        timetable.push({
          course: c.name,
          lecturer: c.lecturer,
          day: d,
          time: t
        });

        used[key] = true;
        break;
      }
    }
  }

  return timetable;
}

// DISPLAY
function displayTimetable(timetable) {

  const output = document.getElementById("output");
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const times = getTimes();
  const schoolName = document.getElementById("schoolName").value;

  let html = `<div id="printArea">`;

  html += `<h2 style="text-align:center;">${schoolName || "School Timetable"}</h2>`;

  html += `<table border="1" width="100%">`;
  html += `<tr><th>Day</th>`;
  times.forEach(t => html += `<th>${t}</th>`);
  html += `</tr>`;

  days.forEach(day => {
    html += `<tr><td><b>${day}</b></td>`;

    times.forEach(time => {
      let entry = timetable.find(t => t.day === day && t.time === time);

      html += `<td>
        <b>${entry?.course || "—"}</b><br>
        <small>${entry?.lecturer || ""}</small>
      </td>`;
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

// PRINT
function printTimetable() {
  window.print();
}

// PDF
function downloadPDF() {
  window.print();
}

// GENERATE
function generate() {
  const data = {
    courses: getCourses(),
    rooms: getRooms(),
    times: getTimes(),
    days: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  };

  const timetable = buildTimetable(data);
  displayTimetable(timetable);
}
