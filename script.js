// ===============================
// GLOBAL STATE
// ===============================
const structureSection = document.getElementById("structureSection");

// ===============================
// INSTITUTION SWITCH (DYNAMIC UI)
// ===============================
document.getElementById("institutionType").addEventListener("change", function () {
  const type = this.value;

  let html = "";

  if (["nursery", "primary", "secondary"].includes(type)) {
    html = `
      <h3>🏫 Academic Structure</h3>

      <label>Levels</label>
      <div id="levels"></div>
      <button onclick="addLevel()">+ Add Level</button>

      <label>Classes per Level</label>
      <input type="number" id="classCount" placeholder="e.g 2 (A, B)">
    `;
  }

  if (["college", "polytechnic", "university"].includes(type)) {
    html = `
      <h3>🏛️ Academic Structure</h3>

      <label>Faculty / School</label>
      <div id="faculties"></div>
      <button onclick="addFaculty()">+ Add Faculty</button>

      <label>Departments</label>
      <div id="departments"></div>
      <button onclick="addDepartment()">+ Add Department</button>

      <label>Levels</label>
      <div id="levels"></div>
      <button onclick="addLevel()">+ Add Level</button>
    `;
  }

  structureSection.innerHTML = html;
});

// ===============================
// ADD FUNCTIONS
// ===============================
function addLevel() {
  document.getElementById("levels").innerHTML += `
    <input placeholder="e.g Primary 1 or ND1 or 100 Level">
  `;
}

function addFaculty() {
  document.getElementById("faculties").innerHTML += `
    <input placeholder="e.g School of Engineering">
  `;
}

function addDepartment() {
  document.getElementById("departments").innerHTML += `
    <input placeholder="e.g Computer Science">
  `;
}

function addCourse() {
  document.getElementById("courses").innerHTML += `
    <div class="card">
      <input placeholder="Course Name">
      <input placeholder="Course Code">
      <input placeholder="Lecturer Name">
      <select>
        <option value="Theory">Theory</option>
        <option value="Lab">Lab</option>
        <option value="Workshop">Workshop</option>
      </select>
    </div>
  `;
}

function addStaff() {
  document.getElementById("staff").innerHTML += `
    <input placeholder="Staff Name">
  `;
}

function addRoom() {
  document.getElementById("rooms").innerHTML += `
    <div class="room">
      <input placeholder="Room Name">
      <select>
        <option value="Classroom">Classroom</option>
        <option value="Lecture Hall">Lecture Hall</option>
        <option value="Lab">Lab</option>
        <option value="Workshop">Workshop</option>
      </select>
    </div>
  `;
}

function addTime() {
  document.getElementById("times").innerHTML += `
    <input placeholder="e.g 8:00 - 9:00">
  `;
}

// ===============================
// DATA COLLECTION
// ===============================
function collectData() {
  return {
    courses: getCourseData(),
    rooms: getRoomData(),
    times: getInputs("times"),
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  };
}

// ===============================
// GET INPUTS (GENERIC)
// ===============================
function getInputs(id) {
  const container = document.getElementById(id);
  if (!container) return [];

  const inputs = container.querySelectorAll("input");
  return Array.from(inputs)
    .map(input => input.value.trim())
    .filter(val => val !== "");
}

// ===============================
// GET COURSES
// ===============================
function getCourseData() {
  const container = document.getElementById("courses");
  const cards = container.querySelectorAll(".card");

  let courses = [];

  cards.forEach(card => {
    const inputs = card.querySelectorAll("input");
    const select = card.querySelector("select");

    const name = inputs[0].value.trim();
    const code = inputs[1].value.trim();
    const lecturer = inputs[2].value.trim();
    const type = select.value;

    if (name && lecturer) {
      courses.push({
        name,
        code,
        lecturer,
        type
      });
    }
  });

  return courses;
}

// ===============================
// GET ROOMS
// ===============================
function getRoomData() {
  const container = document.getElementById("rooms");
  const divs = container.querySelectorAll(".room");

  let rooms = [];

  divs.forEach(div => {
    const input = div.querySelector("input");
    const select = div.querySelector("select");

    const name = input.value.trim();
    const type = select.value;

    if (name) {
      rooms.push({ name, type });
    }
  });

  return rooms;
}

// ===============================
// TIMETABLE ENGINE (NO CLASHES)
// ===============================
function buildTimetable(data) {
  let timetable = [];

  let used = {
    lecturer: {},
    room: {}
  };

  for (let course of data.courses) {
    let assigned = false;

    for (let day of data.days) {
      for (let time of data.times) {

        let room = findAvailableRoom(course, data.rooms, day, time, used);
        if (!room) continue;

        let lecturerKey = `${course.lecturer}-${day}-${time}`;
        let roomKey = `${room.name}-${day}-${time}`;

        if (used.lecturer[lecturerKey]) continue;
        if (used.room[roomKey]) continue;

        // ASSIGN SLOT
        timetable.push({
          course: course.name,
          code: course.code,
          lecturer: course.lecturer,
          day,
          time,
          room: room.name,
          type: course.type
        });

        // MARK USED
        used.lecturer[lecturerKey] = true;
        used.room[roomKey] = true;

        assigned = true;
        break;
      }
      if (assigned) break;
    }

    if (!assigned) {
      console.warn("⚠️ Could not schedule:", course.name);
    }
  }

  return timetable;
}

// ===============================
// ROOM MATCHING LOGIC
// ===============================
function findAvailableRoom(course, rooms, day, time, used) {

  for (let room of rooms) {

    let key = `${room.name}-${day}-${time}`;
    if (used.room[key]) continue;

    // MATCH COURSE TYPE TO ROOM TYPE
    if (course.type === "Lab" && room.type !== "Lab") continue;
    if (course.type === "Workshop" && room.type !== "Workshop") continue;

    return room;
  }

  return null;
}

// ===============================
// GENERATE FUNCTION (FINAL)
// ===============================
function generate() {
  const data = collectData();

  if (!data.courses.length) {
    alert("❌ Please add courses");
    return;
  }

  if (!data.rooms.length) {
    alert("❌ Please add rooms");
    return;
  }

  if (!data.times.length) {
    alert("❌ Please add time slots");
    return;
  }

  const timetable = buildTimetable(data);

  console.log("✅ FINAL TIMETABLE:", timetable);

  alert("✅ Timetable Generated! Check console.");
}
