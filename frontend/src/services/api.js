import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — redirect to login on 401 (only if not already on /login or calling auth/login)
api.interceptors.response.use(
  res => res,
  err => {
    const isLoginEndpoint = err.config?.url?.includes('/auth/login')
    const isOnLoginPage = window.location.pathname === '/login'

    if (err.response?.status === 401 && !isLoginEndpoint && !isOnLoginPage) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ---- Auth ----
export const authService = {
  login: (identifier, password) => api.post('/auth/login', { identifier, email: identifier, password }),
  me: () => api.get('/auth/me'),
}

// ---- Admin ----
export const adminService = {
  dashboard: () => api.get('/admin/dashboard'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getStudent: (id) => api.get(`/admin/students/${id}`),
  addStudent: (data) => api.post('/admin/students', data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  toggleStudentStatus: (id) => api.patch(`/admin/students/${id}/toggle-status`),

  getFaculty: () => api.get('/admin/faculty'),
  getFacultyById: (id) => api.get(`/admin/faculty/${id}`),
  addFaculty: (data) => api.post('/admin/faculty', data),
  updateFaculty: (id, data) => api.put(`/admin/faculty/${id}`, data),
  toggleFacultyStatus: (id) => api.patch(`/admin/faculty/${id}/toggle-status`),

  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  enroll: (studentId, courseId) => api.post('/admin/enroll', { studentId, courseId }),

  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),

  getActivityLogs: () => api.get('/admin/activity-logs'),
  getReports: () => api.get('/admin/reports/overview'),
}

// ---- Courses / Subjects ----
export const courseService = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getFacultyCourses: () => api.get('/faculty/courses'),
  getStudentCourses: () => api.get('/student/courses'),

  getSubjects: () => api.get('/subjects'),
  getSubjectsByCourse: (courseId) => api.get(`/subjects/by-course/${courseId}`),
  createSubject: (data) => api.post('/subjects', data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
}

// ---- Attendance ----
export const attendanceService = {
  // Faculty / Admin
  startSession: (courseId, section, sessionType) =>
    api.post(`/faculty/attendance/session/start`, null, { params: { courseId, section, sessionType } }),
  closeSession: (sessionId) => api.post(`/faculty/attendance/session/${sessionId}/close`),
  getSessionStatus: (sessionId) => api.get(`/faculty/attendance/session/${sessionId}/status`),
  markManual: (courseId, date, records) =>
    api.post(`/faculty/attendance/manual`, records, { params: { courseId, date } }),
  getCourseAttendance: (courseId, date) =>
    api.get(`/faculty/attendance/course/${courseId}`, { params: date ? { date } : {} }),
  getPendingCorrections: () => api.get('/faculty/attendance/corrections/pending'),
  reviewCorrection: (correctionId, approve, remarks) =>
    api.patch(`/faculty/attendance/corrections/${correctionId}/review`, null, { params: { approve, remarks } }),

  // Student
  checkIn: (data) => api.post('/student/attendance/check-in', data),
  getMyAttendance: () => api.get('/student/attendance'),
  getByStudent: () => api.get('/student/attendance'),
  getAttendanceSummary: () => api.get('/student/attendance/summary'),
  submitCorrection: (data) => api.post('/student/attendance/correction', data),
  getMyCorrections: () => api.get('/student/attendance/corrections'),
  mark: (record) => api.post('/faculty/attendance/manual', [record], { params: { courseId: record.courseId, date: record.date } }),
}

// ---- Marks ----
export const marksService = {
  upload: (data) => api.post('/faculty/marks', data),
  uploadBatch: (courseId, examType, totalMarks, list) =>
    api.post('/faculty/marks/batch', list, { params: { courseId, examType, totalMarks } }),
  getCourseMarks: (courseId) => api.get(`/faculty/marks/course/${courseId}`),
  getByCourse: (courseId) => api.get(`/faculty/marks/course/${courseId}`),
  getMyMarks: () => api.get('/student/marks'),
  getByStudent: () => api.get('/student/marks'),
  getPerformanceSummary: () => api.get('/student/marks/performance'),
}

// ---- Timetable ----
export const timetableService = {
  getAll: () => api.get('/timetable'),
  getSchedule: (courseId, semester, section) =>
    api.get('/timetable/schedule', { params: { courseId, semester, section } }),
  getMyTimetable: () => api.get('/student/timetable'),
  getFacultyTimetable: () => api.get('/faculty/timetable'),
  create: (data) => api.post('/timetable', data),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  delete: (id) => api.delete(`/timetable/${id}`),
}

// ---- Events ----
export const eventService = {
  getAll: () => api.get('/student/events/all'),
  getUpcoming: () => api.get('/student/events'),
  getById: (id) => api.get(`/student/events/${id}`),
  register: (eventId) => api.post(`/student/events/${eventId}/register`),
  cancelRegistration: (eventId) => api.delete(`/student/events/${eventId}/cancel`),
  getMyRegistrations: () => api.get('/student/events/my-registrations'),

  // Faculty / Admin
  create: (data) => api.post('/faculty/events', data),
  update: (id, data) => api.put(`/faculty/events/${id}`, data),
  updateStatus: (id, status) => api.patch(`/faculty/events/${id}/status`, null, { params: { status } }),
  getParticipants: (eventId) => api.get(`/faculty/events/${eventId}/participants`),
  markAttendance: (eventId, studentId, status) =>
    api.patch(`/faculty/events/${eventId}/participants/${studentId}/attendance`, null, { params: { status } }),
  recordResult: (eventId, data) => api.post(`/faculty/events/${eventId}/results`, data),
  getEventCertificates: (eventId) => api.get(`/faculty/events/${eventId}/certificates`),
}

// ---- Certificates ----
export const certificateService = {
  getMyCertificates: () => api.get('/student/certificates'),
  getCertificate: (certId) => api.get(`/student/certificates/${certId}`),
  verify: (certId) => api.get(`/certificates/verify/${certId}`),
  generate: (data) => api.post('/faculty/certificates/generate', data),
  batchGenerate: (eventId, data) => api.post(`/faculty/events/${eventId}/certificates/batch`, data),
  getTemplates: () => api.get('/faculty/certificate-templates'),
}

// ---- Notifications ----
export const notificationService = {
  getAll: (role) => {
    const base = role === 'FACULTY' || role === 'ADMIN' ? '/faculty' : '/student'
    return api.get(`${base}/notifications`)
  },
  getMyNotifications: () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const base = user?.role === 'FACULTY' || user?.role === 'ADMIN' ? '/faculty' : '/student'
      return api.get(`${base}/notifications`)
    } catch {
      return Promise.resolve({ data: [] })
    }
  },
  getUnreadCount: (role) => {
    const base = role === 'FACULTY' || role === 'ADMIN' ? '/faculty' : '/student'
    return api.get(`${base}/notifications/unread-count`)
  },
  markRead: (id, role) => {
    const base = role === 'FACULTY' || role === 'ADMIN' ? '/faculty' : '/student'
    return api.patch(`${base}/notifications/${id}/read`)
  },
  markAsRead: (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const base = user?.role === 'FACULTY' || user?.role === 'ADMIN' ? '/faculty' : '/student'
      return api.patch(`${base}/notifications/${id}/read`)
    } catch {
      return Promise.resolve()
    }
  },
  markAllRead: (role) => {
    const base = role === 'FACULTY' || role === 'ADMIN' ? '/faculty' : '/student'
    return api.patch(`${base}/notifications/read-all`)
  },
  markAllAsRead: () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const base = user?.role === 'FACULTY' || user?.role === 'ADMIN' ? '/faculty' : '/student'
      return api.patch(`${base}/notifications/read-all`)
    } catch {
      return Promise.resolve()
    }
  },
  getAnnouncements: (role) => {
    const base = role === 'FACULTY' || role === 'ADMIN' ? '/faculty' : '/student'
    return api.get(`${base}/announcements`)
  },
}
