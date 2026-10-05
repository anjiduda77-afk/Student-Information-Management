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
    const isVerifyRoute = window.location.pathname.startsWith('/verify') ||
                          window.location.pathname.startsWith('/certificates/verify') ||
                          err.config?.url?.includes('/certificates/verify') ||
                          err.config?.url?.includes('/verify')

    if (err.response?.status === 401 && !isLoginEndpoint && !isOnLoginPage && !isVerifyRoute) {
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
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePhoto: (photoUrl) => api.patch('/auth/profile/photo', { photoUrl }),
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

  // Account Security — Admin can reset passwords
  resetUserPassword: (userId, data) => api.post(`/admin/users/${userId}/reset-password`, data),
  toggleUserStatus: (userId) => api.patch(`/admin/users/${userId}/toggle-status`),
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
  // Faculty
  getTodayClasses: (date) =>
    api.get('/faculty/attendance/today-classes', { params: date ? { date } : {} }),
  startSessionFromTimetable: (timetableId, sessionType = 'ONLINE_QR') =>
    api.post(`/faculty/attendance/session/start-from-timetable/${timetableId}`, null, { params: { sessionType } }),
  getSessionStudents: (sessionId) =>
    api.get(`/faculty/attendance/session/${sessionId}/students`),
  markSessionManual: (sessionId, records) =>
    api.post(`/faculty/attendance/session/${sessionId}/manual`, records),
  getFacultyHistory: (params) =>
    api.get('/faculty/attendance/history', { params }),
  getFacultySubjectSummary: (subjectId) =>
    api.get('/faculty/attendance/subject-summary', { params: { subjectId } }),

  // Faculty Manual Attendance Flow
  getAttendanceDepartments: () => api.get('/faculty/attendance/departments'),
  getAttendanceSections: (department) => api.get('/faculty/attendance/sections', { params: { department } }),
  getManualRoster: (date, department, section, subjectId, period) =>
    api.get('/faculty/attendance/roster', { params: { date, department, section, subjectId, period } }),
  saveManualRoster: (data) => api.post('/faculty/attendance/save-roster', data),

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
  getMySubjectWiseAttendance: () => api.get('/student/attendance/subject-wise'),
  getMyDateWiseAttendance: (params) => api.get('/student/attendance/date-wise', { params }),
  getByStudent: () => api.get('/student/attendance'),
  getAttendanceSummary: () => api.get('/student/attendance/summary'),
  submitCorrection: (data) => api.post('/student/attendance/correction', data),
  getMyCorrections: () => api.get('/student/attendance/corrections'),
  mark: (record) => api.post('/faculty/attendance/manual', [record], { params: { courseId: record.courseId, date: record.date } }),

  // Admin
  getAdminOverview: (params) => api.get('/admin/attendance/overview', { params }),
  getAdminShortageReport: (params) => api.get('/admin/attendance/shortage-report', { params }),
  adminCorrectAttendance: (id, newStatus, reason) =>
    api.post(`/admin/attendance/${id}/correct`, null, { params: { newStatus, reason } }),
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
  // All users — read events
  getAll: () => api.get('/events'),
  getUpcoming: () => api.get('/events/upcoming'),
  getCompleted: () => api.get('/events/completed'),
  getById: (id) => api.get(`/events/${id}`),

  // Student — registration
  register: (eventId) => api.post(`/student/events/${eventId}/register`),
  cancelRegistration: (eventId) => api.delete(`/student/events/${eventId}/cancel`),
  getMyRegistrations: () => api.get('/student/events/my-registrations'),

  // Admin / Faculty — Event CRUD
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  updateStatus: (id, status) => api.patch(`/events/${id}/status`, null, { params: { status } }),

  // Coordinators (Admin only)
  getCoordinators: (eventId) => api.get(`/events/${eventId}/coordinators`),
  assignCoordinator: (eventId, facultyId, remarks) =>
    api.post(`/events/${eventId}/coordinators`, { facultyId, remarks }),
  removeCoordinator: (eventId, facultyId) => api.delete(`/events/${eventId}/coordinators/${facultyId}`),

  // Participants
  getParticipants: (eventId) => api.get(`/events/${eventId}/participants`),
  registerStudent: (eventId, studentId) => api.post(`/events/${eventId}/participants/${studentId}`),
  removeParticipant: (eventId, studentId) => api.delete(`/events/${eventId}/participants/${studentId}`),
  markAttendance: (eventId, studentId, status) =>
    api.patch(`/events/${eventId}/participants/${studentId}/attendance`, null, { params: { status } }),

  // Results
  getResults: (eventId) => api.get(`/events/${eventId}/results`),
  updateResult: (eventId, studentId, data) => api.put(`/events/${eventId}/results/${studentId}`, data),

  // Certificates for event
  getEventCertificates: (eventId) => api.get(`/events/${eventId}/certificates`),
  generateCertificate: (eventId, data) => api.post(`/events/${eventId}/certificates/generate`, data),
  generateBatchCertificates: (eventId, reqs) => api.post(`/events/${eventId}/certificates/batch`, reqs),
}

// ---- Certificates ----
export const certificateService = {
  // Student
  getMyCertificates: () => api.get('/student/certificates'),
  getCertificate: (certId) => api.get(`/student/certificates/${certId}`),

  // Public verification
  verify: (certId) => api.get(`/certificates/verify/${certId}`),

  // Admin — Certificate records
  getAll: () => api.get('/certificates'),
  getById: (certId) => api.get(`/certificates/${certId}`),
  downloadPdfUrl: (certId) => `/api/certificates/${certId}/download`,
  downloadPdf: async (certId, fallbackCertData) => {
    try {
      const response = await api.get(`/certificates/${certId}/download`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Aditya_University_Certificate_${certId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
      return true
    } catch (err) {
      console.warn('Backend PDF download error, attempting client-side generator fallback:', err)
      if (fallbackCertData) {
        const { downloadCertificatePDF } = await import('../utils/certificateGenerator')
        await downloadCertificatePDF(fallbackCertData)
        return true
      }
      throw err
    }
  },
  revoke: (id, reason) => api.post(`/certificates/${id}/revoke`, { reason }),

  // Certificate Templates
  getTemplates: () => api.get('/certificates/templates'),
  getTemplate: (id) => api.get(`/certificates/templates/${id}`),
  createTemplate: (data) => api.post('/certificates/templates', data),
  updateTemplate: (id, data) => api.put(`/certificates/templates/${id}`, data),
  publishTemplate: (id) => api.post(`/certificates/templates/${id}/publish`),
  archiveTemplate: (id) => api.post(`/certificates/templates/${id}/archive`),
  duplicateTemplate: (id) => api.post(`/certificates/templates/${id}/duplicate`),
  deleteTemplate: (id) => api.delete(`/certificates/templates/${id}`),
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
