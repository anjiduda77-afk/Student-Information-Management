/**
 * Reusable validation rules and form helpers for Smart Student Information System - Aditya University
 */

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export const isValidMobile = (mobile) => {
  if (!mobile) return true // mobile is optional, but if provided must be 10 digits starting with 6-9
  const mobileRegex = /^[6-9]\d{9}$/
  return mobileRegex.test(mobile.trim())
}

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.trim().length >= 6
}

export const isValidSemester = (sem) => {
  const num = Number(sem)
  return !isNaN(num) && num >= 1 && num <= 8
}

export const isValidAdmissionYear = (year) => {
  const num = Number(year)
  const currentYear = new Date().getFullYear()
  return !isNaN(num) && num >= 2000 && num <= currentYear + 1
}

export const isValidCode = (code) => {
  if (!code || typeof code !== 'string') return false
  return /^[A-Za-z0-9_-]{2,20}$/.test(code.trim())
}

export const isValidMarks = (obtained, total) => {
  const obs = Number(obtained)
  const tot = Number(total)
  if (isNaN(obs) || isNaN(tot)) return false
  if (tot <= 0) return false
  if (obs < 0 || obs > tot) return false
  return true
}

export const isFutureDate = (dateStr) => {
  if (!dateStr) return false
  const inputDate = new Date(dateStr)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return inputDate > today
}

export const isValidTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return false
  return startTime < endTime
}

/** Form Specific Validators - return error message string or null if valid */

export const validateStudentForm = (data) => {
  const errors = {}
  if (!data.name || !data.name.trim()) errors.name = 'Full name is required'
  if (!isValidEmail(data.email)) errors.email = 'Enter a valid email address'
  if (!data.rollNumber || !data.rollNumber.trim()) errors.rollNumber = 'Roll number is required'
  if (data.password !== undefined && !isValidPassword(data.password)) {
    errors.password = 'Password must be at least 6 characters'
  }
  if (data.mobileNumber && !isValidMobile(data.mobileNumber)) {
    errors.mobileNumber = 'Mobile number must be a 10-digit number starting with 6-9'
  }
  if (data.semester && !isValidSemester(data.semester)) {
    errors.semester = 'Semester must be between 1 and 8'
  }
  if (data.admissionYear && !isValidAdmissionYear(data.admissionYear)) {
    errors.admissionYear = `Admission year must be between 2000 and ${new Date().getFullYear() + 1}`
  }
  return errors
}

export const validateFacultyForm = (data) => {
  const errors = {}
  if (!data.name || !data.name.trim()) errors.name = 'Full name is required'
  if (!isValidEmail(data.email)) errors.email = 'Enter a valid email address'
  if (!data.facultyId || !data.facultyId.trim()) errors.facultyId = 'Faculty ID is required'
  if (data.password !== undefined && !isValidPassword(data.password)) {
    errors.password = 'Password must be at least 6 characters'
  }
  if (data.mobileNumber && !isValidMobile(data.mobileNumber)) {
    errors.mobileNumber = 'Mobile number must be a 10-digit number starting with 6-9'
  }
  return errors
}

export const validateCourseForm = (data) => {
  const errors = {}
  if (!data.code || !data.code.trim()) errors.code = 'Course code is required'
  if (!data.name || !data.name.trim()) errors.name = 'Course name is required'
  
  const credits = Number(data.credits)
  if (isNaN(credits) || credits < 1 || credits > 10) errors.credits = 'Credits must be between 1 and 10'

  const semester = Number(data.semester)
  if (isNaN(semester) || semester < 1 || semester > 8) errors.semester = 'Semester must be between 1 and 8'

  return errors
}

export const validateDepartmentForm = (data) => {
  const errors = {}
  if (!data.code || !data.code.trim()) errors.code = 'Department code is required'
  if (!data.name || !data.name.trim()) errors.name = 'Department name is required'
  return errors
}

export const validateTimetableForm = (data) => {
  const errors = {}
  if (!data.courseId) errors.courseId = 'Course selection is required'
  if (!data.facultyId) errors.facultyId = 'Faculty selection is required'
  if (!data.dayOfWeek) errors.dayOfWeek = 'Day of week is required'
  if (!data.startTime) errors.startTime = 'Start time is required'
  if (!data.endTime) errors.endTime = 'End time is required'
  if (data.startTime && data.endTime && !isValidTimeRange(data.startTime, data.endTime)) {
    errors.time = 'Start time must be before end time'
  }
  if (!data.classroom || !data.classroom.trim()) errors.classroom = 'Classroom is required'
  return errors
}

export const validateEventForm = (data) => {
  const errors = {}
  if (!data.title || !data.title.trim()) errors.title = 'Event title is required'
  if (!data.eventDate) errors.eventDate = 'Event date is required'
  return errors
}
