// ================= GLOBAL =================
const structureSection = document.getElementById("structureSection");

// ================= SWITCH =================
document.getElementById("institutionType").addEventListener("change", function () {

  // RESET ALL
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
      <button onclick="addLevel()">+ Add Level</button>

      <input id="classCount" placeholder="Classes per level (e.g 2)">
    `;
  }

  if (["college","polytechnic","university"].includes(type)) {
    html = `
      <h3>🏛️ Academic Structure</h3>

      <div id="faculties"></div>
      <button onclick="addFaculty()">+ Add Faculty</button>

      <div id="departments"></div>
      <button onclick="addDepartment()">+ Add Department</button>

      <div id="levels"></div>
      <button onclick="addLevel()">+ Add Level</button>
    `;
  }

  structureSection.innerHTML = html;
});

// ================= HELPERS =================
function createItem(containerId, html) {
  const container = document.getElementById(containerId);

  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    ${html}
    <button onclick="editItem(this)">✏️ Edit</button>
    <button onclick="deleteItem(this)">❌ Delete</button>
  `;

  container.appendChild(div);
}

function deleteItem(btn) {
  btn.parentElement.remove();
}

function editItem(btn) {
  const inputs = btn.parentElement.querySelectorAll("input");
  inputs.forEach(i => i.disabled = !i.disabled);
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
  const container = document.getElementById("courses");

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

    <button onclick="editItem(this)">✏️ Edit</button>
    <button onclick="deleteItem(this)">❌ Delete</button>
  `;

  container.appendChild(div);
}

function addStaff() {
  createItem("staff", `<input placeholder="Staff Name">`);
}

function addRoom() {
  const container = document.getElementById("rooms");

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

    <button onclick="editItem(this)">✏️ Edit</button>
    <button onclick="deleteItem(this)">❌ Delete</button>
  `;

  container.appendChild(div);
}

function addTime() {
  createItem("times", `<input placeholder="8:00 - 9:00">`);
}

// ================= DATA =================
function getSimple(id) {
  return Array.from(document.querySelectorAll(`#${id} .item input`))
    .map(i => i.value.trim())
    .filter(v => v);
}

function getCourses() {
  const items = document.querySelectorAll("#courses .item");
  let courses = [];

  items.forEach(item => {
    const inputs = item.querySelectorAll("input");
    const select = item.querySelector("select");

    if (inputs[0].value && inputs[2].value) {
      courses.push({
        name: inputs[0].value,
        code: inputs[1].value,
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

// ================= ENGINE =================
function buildTimetable(data) {

  let timetable = [];
  let used = { lecturer:{}, room:{} };

  for (let course of data.courses) {

    let placed = false;

    for (let day of data.days) {
      for (let time of data.times) {

        let room = findRoom(course, data.rooms, day, time, used);
        if (!room) continue;

        let lKey = `${course.lecturer}-${day}-${time}`;
        let rKey = `${room.name}-${day}-${time}`;

        if (used.lecturer[lKey] || used.room[rKey]) continue;

        timetable.push({
          course: course.name,
          lecturer: course.lecturer,
          room: room.name,
          day,
          time
        });

        used.lecturer[lKey] = true;
        used.room[rKey] = true;

        placed = true;
        break;
      }
      if (placed) break;
    }
  }

  return timetable;
}

// ================= ROOM MATCH =================
function findRoom(course, rooms, day, time, used) {

  for (let room of rooms) {

    let key = `${room.name}-${day}-${time}`;
    if (used.room[key]) continue;

    if (course.type === "Lab" && room.type !== "Lab") continue;
    if (course.type === "Workshop" && room.type !== "Workshop") continue;

    return room;
  }

  return null;
}

// ================= GENERATE =================
function generate() {

  const data = {
    courses: getCourses(),
    rooms: getRooms(),
    times: getSimple("times"),
    days: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  };

  if (!data.courses.length) return alert("Add courses");
  if (!data.rooms.length) return alert("Add rooms");
  if (!data.times.length) return alert("Add time");

  const result = buildTimetable(data);

  console.log("FINAL TIMETABLE:", result);
  alert("✅ Done! Check console");
}
