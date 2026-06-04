const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

const APPOINTMENTS_PATH = path.join(__dirname, 'appointments.json');
const USERS_PATH = path.join(__dirname, 'users.json');
const NOTIFICATIONS_PATH = path.join(__dirname, 'notifications.json');

function readJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } 
    catch { return []; }
}
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
app.get('/api/user/profile', (req, res) => {
  res.json({ message: 'Profile route works' });
});
// ─── USER LOGIN ───────────────────────────────────────────
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readJSON(USERS_PATH);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) return res.json({ user });
    return res.status(401).json({ message: "Email or password incorrect" });
});

// ─── SIGNUP ───────────────────────────────────────────────
app.post('/api/signup', (req, res) => {
    const { fullName, email, password } = req.body;
    const users = readJSON(USERS_PATH);
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: "Email already exists" });
    }
    const newUser = {
        id: Date.now().toString(),
        fullName, email, password,
        role: 'patient',
        healthProfile: null,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJSON(USERS_PATH, users);
    res.status(201).json({ user: newUser });
});

// ─── ADMIN LOGIN ──────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@nutricoach.com" && password === "nutricoach2026") {
        return res.status(200).json({ message: "Login Successful", role: "admin" });
    }
    return res.status(401).json({ message: "Invalid Email or Password" });
});

// ─── GET APPOINTMENTS ─────────────────────────────────────
app.get('/api/appointments', (req, res) => {
    let appointments = readJSON(APPOINTMENTS_PATH);
    // Auto-assign IDs to old appointments that don't have one, then save
    let changed = false;
    appointments = appointments.map(a => {
        if (!a.id) { changed = true; return { ...a, id: Date.now().toString() + Math.random().toString(36).slice(2), status: a.status || 'pending' }; }
        return a;
    });
    if (changed) writeJSON(APPOINTMENTS_PATH, appointments);
    res.json(appointments);
});

// ─── BOOK APPOINTMENT ─────────────────────────────────────
app.post('/api/appointments', (req, res) => {
    const appointments = readJSON(APPOINTMENTS_PATH);
    const newApp = {
        ...req.body,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    appointments.push(newApp);
    writeJSON(APPOINTMENTS_PATH, appointments);
    res.status(200).json({ message: "Appointment saved", appointment: newApp });
});

// ─── CONFIRM or DECLINE APPOINTMENT ──────────────────────
app.put('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed' or 'declined'

    const appointments = readJSON(APPOINTMENTS_PATH);
    const index = appointments.findIndex(a => a.id === id);

    if (index === -1) return res.status(404).json({ message: "Appointment not found" });

    const appointment = appointments[index];

    if (status === 'confirmed') {
        // ✅ Update status to confirmed
        appointments[index].status = 'confirmed';
        writeJSON(APPOINTMENTS_PATH, appointments);

        // 🔔 Send notification to patient
        const notifications = readJSON(NOTIFICATIONS_PATH);
        notifications.push({
            id: Date.now().toString(),
            patientEmail: appointment.patientEmail,
            type: 'appointment_confirmed',
            message: `✅ Your appointment on ${appointment.date} at ${appointment.time} has been confirmed! The nutritionist will contact you soon.`,
            read: false,
            createdAt: new Date().toISOString()
        });
        writeJSON(NOTIFICATIONS_PATH, notifications);

        return res.json({ success: true, message: "Appointment confirmed" });
    }

    if (status === 'declined') {
        // ❌ Remove appointment from list
        const removed = appointments.splice(index, 1)[0];
        writeJSON(APPOINTMENTS_PATH, appointments);

        // 🔔 Send notification to patient
        const notifications = readJSON(NOTIFICATIONS_PATH);
        notifications.push({
            id: Date.now().toString(),
            patientEmail: removed.patientEmail,
            type: 'appointment_declined',
            message: `❌ Your appointment request for ${removed.date} at ${removed.time} was not available. Please book a new appointment at a different time.`,
            read: false,
            createdAt: new Date().toISOString()
        });
        writeJSON(NOTIFICATIONS_PATH, notifications);

        return res.json({ success: true, message: "Appointment declined and removed" });
    }

    return res.status(400).json({ message: "Invalid status" });
});

// ─── GET NOTIFICATIONS FOR PATIENT ───────────────────────
app.get('/api/notifications/patient/:email', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const notifications = readJSON(NOTIFICATIONS_PATH);
    const patientNotifs = notifications
        .filter(n => n.patientEmail === email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(patientNotifs);
});

// ─── MARK ALL NOTIFICATIONS AS READ ──────────────────────
app.patch('/api/notifications/patient/:email/read-all', (req, res) => {
    const email = decodeURIComponent(req.params.email);
    const notifications = readJSON(NOTIFICATIONS_PATH);
    notifications.forEach(n => {
        if (n.patientEmail === email) n.read = true;
    });
    writeJSON(NOTIFICATIONS_PATH, notifications);
    res.json({ success: true });
});

app.listen(5001, () => {
    console.log("🚀 Server running on port 5001");
});