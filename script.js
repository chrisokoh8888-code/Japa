// ================= SWITCH =================
document.getElementById("institutionType").addEventListener("change", function () {

  document.getElementById("courses").innerHTML = "";
  document.getElementById("staff").innerHTML = "";
  document.getElementById("rooms").innerHTML = "";
  document.getElementById("times").innerHTML = "";

  const type = this.value;
  let html = "";

  if (["nursery","primary","secondary"].includes(type)) {
    html = `
      <h3>🏫 Academic Structure</h3>
      <div id="levels"></div>
      <button class="add-btn" onclick="addLevel()">+ Add Level</button>
      <input id="classCount" placeholder="Classes per level">
    `;
  }

  if (["college","polytechnic","university"].includes(type)) {
    html = `
      <h3>🏛️ Academic Structure</h3>
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

// ================= HELPERS =================
function createItem(containerId, html) {
  const container = document.getElementById(containerId);

  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    ${html}
    <button onclick="deleteItem(this)">❌</button>
  `;

  container.appendChild(div);
}

function deleteItem(btn) {
  btn.parentElement.remove();
}

// ================= ADD =================
function addLevel() {
  createItem("levels", `<input placeholder="Level">`);
}

function addFaculty() {
  createItem("faculties", `<input placeholder="Faculty">`);
}

function addDepartment() {
  createItem("departments", `<input placeholder="Department">`);
}

function addCourse() {
  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <input placeholder="Course Name">
    <input placeholder="Course Code">
    <input placeholder="Lecturer">
    <select>
      <option>Theory</option>
      <option>Lab</option>
      <option>Workshop</option>
    </select>
    <button onclick="deleteItem(this)">❌</button>
  `;

  document.getElementById("courses").appendChild(div);
}

function addStaff() {
  createItem("staff", `<input placeholder="Staff Name">`);
}

function addRoom() {
  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <input placeholder="Room Name">
    <select>
      <option>Classroom</option>
      <option>Lecture Hall</option>
      <option>Lab</option>
      <option>Workshop</option>
    </select>
    <button onclick="deleteItem(this)">❌</button>
  `;

  document.getElementById("rooms").appendChild(div);
}

function addTime() {
  createItem("times", `<input placeholder="8:00 - 9:00">`);
}

// ================= DATA =================
function getCourses() {
  const items = document.querySelectorAll("#courses .item");
  let courses = [];

  items.forEach(item => {
    const inputs = item.querySelectorAll("input");
    const select = item.querySelector("select");

    if (inputs[0].value && inputs[2].value) {
      courses.push({
        name: inputs[0].value,
        lecturer: inputs[2].value,
        type: select.value
      });
    }
  });

  return courses;
}

function getRooms() {
  const items = document.querySelectorAll("#rooms .item");
  let rooms = [];

  items.forEach(item => {
    const input = item.querySelector("input");
    const select = item.querySelector("select");

    if (input.value) {
      rooms.push({
        name: input.value,
        type: select.value
      });
    }
  });

  return rooms;
}

function getTimes() {
  return Array.from(document.querySelectorAll("#times .item input"))
    .map(i => i.value)
    .filter(v => v);
}

// ================= ENGINE =================
function buildTimetable(data) {

  let timetable = [];
  let used = { lecturer:{}, room:{} };

  for (let course of data.courses) {

    for (let day of data.days) {
      for (let time of data.times) {

        let room = data.rooms.find(r => {
          if (course.type === "Lab") return r.type === "Lab";
          if (course.type === "Workshop") return r.type === "Workshop";
          return true;
        });

        if (!room) continue;

        let keyL = `${course.lecturer}-${day}-${time}`;
        let keyR = `${room.name}-${day}-${time}`;

        if (used.lecturer[keyL] || used.room[keyR]) continue;

        timetable.push({ course: course.name, day, time, room: room.name });

        used.lecturer[keyL] = true;
        used.room[keyR] = true;

        break;
      }
    }
  }

  return timetable;
}

// ================= GENERATE =================
function generate() {

  const data = {
    courses: getCourses(),
    rooms: getRooms(),
    times: getTimes(),
    days: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  };

  if (!data.courses.length) return alert("Add courses");
  if (!data.rooms.length) return alert("Add rooms");
  if (!data.times.length) return alert("Add time");

  const result = buildTimetable(data);

  console.log(result);
  alert("✅ Timetable Generated");
}
