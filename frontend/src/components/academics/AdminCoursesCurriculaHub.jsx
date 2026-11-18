import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  courseService, adminService
} from '../../services/api'
import { toast } from '../Toast'
import { Modal } from '../Modal'
import { TableSkeleton, Spinner } from '../Loading'
import {
  BookOpen, Plus, Search, Filter, Maximize2, Minimize2,
  LayoutList, LayoutGrid, Columns, Edit3, Trash2, Eye,
  Users, CheckCircle, AlertTriangle, Layers, GraduationCap,
  Building, RefreshCw, X, ChevronRight, Award, Clock
} from 'lucide-react'

// Course Type calculation based on name/code/credits
const getCourseType = (course) => {
  const name = (course.name || '').toLowerCase()
  const code = (course.code || '').toLowerCase()
  if (name.includes('lab') || name.includes('practical') || code.includes('l')) {
    return { label: 'Practical Lab', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
  }
  if (name.includes('project') || name.includes('internship') || name.includes('capstone')) {
    return { label: 'Capstone / Project', bg: '#fdf4ff', color: '#c026d3', border: '#f5d0fe' }
  }
  if (name.includes('elective') || name.includes('open')) {
    return { label: 'Elective Course', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
  }
  return { label: 'Core Theory', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }
}

export default function AdminCoursesCurriculaHub({ initialViewMode }) {
  const [searchParams] = useSearchParams()
  const initialView = initialViewMode || (searchParams.get('view') === 'sections' ? 'sections-matrix' : 'horizontal-table')

  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)

  // Layout View Modes: 'horizontal-table' | 'horizontal-roadmap' | 'grid-cards' | 'sections-matrix'
  const [viewMode, setViewMode] = useState(initialView)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [semesterFilter, setSemesterFilter] = useState('ALL')
  const [creditsFilter, setCreditsFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sectionFilter, setSectionFilter] = useState('ALL')

  // Academic Sections State
  const [sections, setSections] = useState([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [deletingSection, setDeletingSection] = useState(null)
  const [sectionSubmitting, setSectionSubmitting] = useState(false)
  const initialSectionForm = {
    code: '',
    sectionName: 'A',
    semester: 1,
    academicYear: '2025-26',
    departmentId: '',
    advisorId: '',
    roomNumber: 'Newton Block Room 301',
    capacity: 60,
    status: 'ACTIVE'
  }
  const [sectionForm, setSectionForm] = useState(initialSectionForm)

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [detailCourse, setDetailCourse] = useState(null)
  const [deletingCourse, setDeletingCourse] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const initialForm = {
    code: '',
    name: '',
    description: '',
    credits: 4,
    semester: 1,
    sections: 'A, B',
    duration: '4 Years (8 Semesters)',
    facultyId: '',
    departmentId: '',
    status: 'ACTIVE'
  }
  const [courseForm, setCourseForm] = useState(initialForm)

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, dRes, fRes, sRes] = await Promise.all([
        courseService.getAll().catch(() => ({ data: [] })),
        adminService.getDepartments().catch(() => ({ data: [] })),
        adminService.getFaculty().catch(() => ({ data: [] })),
        adminService.getSections().catch(() => ({ data: [] }))
      ])
      setCourses(cRes.data || [])
      setDepartments(dRes.data || [])
      setFaculty(fRes.data || [])
      setSections(sRes.data || [])
    } catch {
      toast.error('Failed to load academic courses, curricula and sections')
    } finally {
      setLoading(false)
    }
  }

  const loadSections = async () => {
    setSectionsLoading(true)
    try {
      const res = await adminService.getSections()
      setSections(res.data || [])
    } catch {
      // silent
    } finally {
      setSectionsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Keyboard shortcut to toggle / exit full screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Filtered Courses Calculation
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // Search match
      const q = search.trim().toLowerCase()
      const matchesSearch = !q ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.facultyName && c.facultyName.toLowerCase().includes(q)) ||
        (c.departmentName && c.departmentName.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))

      // Department match
      const matchesDept = departmentFilter === 'ALL' ||
        String(c.departmentId) === String(departmentFilter) ||
        (c.departmentName && c.departmentName.toLowerCase() === departmentFilter.toLowerCase())

      // Semester match
      const matchesSem = semesterFilter === 'ALL' ||
        String(c.semester) === String(semesterFilter)

      // Credits match
      const credits = Number(c.credits) || 0
      const matchesCredits = creditsFilter === 'ALL' ||
        (creditsFilter === '1-2' && credits <= 2) ||
        (creditsFilter === '3-4' && credits >= 3 && credits <= 4) ||
        (creditsFilter === '5+' && credits >= 5)

      // Status match
      const matchesStatus = statusFilter === 'ALL' ||
        (c.status || 'ACTIVE').toUpperCase() === statusFilter.toUpperCase()

      // Section match
      const matchesSection = sectionFilter === 'ALL' ||
        (c.sections && c.sections.toLowerCase().includes(sectionFilter.toLowerCase()))

      return matchesSearch && matchesDept && matchesSem && matchesCredits && matchesStatus && matchesSection
    })
  }, [courses, search, departmentFilter, semesterFilter, creditsFilter, statusFilter, sectionFilter])

  // Filtered Sections Calculation
  const filteredSections = useMemo(() => {
    return sections.filter(sec => {
      const q = search.trim().toLowerCase()
      const matchesSearch = !q ||
        (sec.code && sec.code.toLowerCase().includes(q)) ||
        (sec.sectionName && sec.sectionName.toLowerCase().includes(q)) ||
        (sec.advisorName && sec.advisorName.toLowerCase().includes(q)) ||
        (sec.roomNumber && sec.roomNumber.toLowerCase().includes(q)) ||
        (sec.departmentName && sec.departmentName.toLowerCase().includes(q)) ||
        (sec.departmentCode && sec.departmentCode.toLowerCase().includes(q))

      const matchesDept = departmentFilter === 'ALL' ||
        String(sec.departmentId) === String(departmentFilter) ||
        (sec.departmentName && sec.departmentName.toLowerCase() === departmentFilter.toLowerCase()) ||
        (sec.departmentCode && sec.departmentCode.toLowerCase() === departmentFilter.toLowerCase())

      const matchesSem = semesterFilter === 'ALL' ||
        String(sec.semester) === String(semesterFilter)

      const matchesSec = sectionFilter === 'ALL' ||
        (sec.sectionName && sec.sectionName.toUpperCase() === sectionFilter.toUpperCase())

      const matchesStatus = statusFilter === 'ALL' ||
        (sec.status || 'ACTIVE').toUpperCase() === statusFilter.toUpperCase()

      return matchesSearch && matchesDept && matchesSem && matchesSec && matchesStatus
    })
  }, [sections, search, departmentFilter, semesterFilter, sectionFilter, statusFilter])

  // Section CRUD Handlers
  const handleSaveSection = async (e) => {
    e.preventDefault()
    setSectionSubmitting(true)
    try {
      const payload = {
        ...sectionForm,
        semester: Number(sectionForm.semester),
        departmentId: sectionForm.departmentId ? Number(sectionForm.departmentId) : null,
        advisorId: sectionForm.advisorId ? Number(sectionForm.advisorId) : null,
        capacity: Number(sectionForm.capacity) || 60
      }
      if (editingSection) {
        await adminService.updateSection(editingSection.id, payload)
        toast.success(`Academic Section ${editingSection.code} updated successfully!`)
        setEditingSection(null)
      } else {
        const res = await adminService.createSection(payload)
        toast.success(`Academic Section ${res.data.code} registered!`)
        setShowAddSectionModal(false)
      }
      loadSections()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save academic section.')
    } finally {
      setSectionSubmitting(false)
    }
  }

  const handleOpenEditSection = (sec) => {
    setEditingSection(sec)
    setSectionForm({
      code: sec.code || '',
      sectionName: sec.sectionName || 'A',
      semester: sec.semester || 1,
      academicYear: sec.academicYear || '2025-26',
      departmentId: sec.departmentId ? String(sec.departmentId) : '',
      advisorId: sec.advisorId ? String(sec.advisorId) : '',
      roomNumber: sec.roomNumber || 'Newton Block Room 301',
      capacity: sec.capacity || 60,
      status: sec.status || 'ACTIVE'
    })
  }

  const handleDeleteSectionConfirm = async () => {
    if (!deletingSection) return
    try {
      await adminService.deleteSection(deletingSection.id)
      toast.success(`Section ${deletingSection.code} removed.`)
      setDeletingSection(null)
      loadSections()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove section.')
    }
  }

  // Aggregate Metrics (KPIs)
  const metrics = useMemo(() => {
    const total = courses.length
    const active = courses.filter(c => (c.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length
    const totalCredits = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0)
    const assignedCount = courses.filter(c => c.facultyId || c.facultyName).length
    const facultyCoveragePct = total > 0 ? Math.round((assignedCount / total) * 100) : 0
    const deptsCount = new Set(courses.map(c => c.departmentName || c.departmentId).filter(Boolean)).size

    return { total, active, totalCredits, facultyCoveragePct, deptsCount }
  }, [courses])

  // Grouped by Semester for Horizontal Roadmap
  const semesterGroups = useMemo(() => {
    const groups = {}
    for (let i = 1; i <= 8; i++) {
      groups[i] = []
    }
    filteredCourses.forEach(c => {
      const sem = c.semester || 1
      if (groups[sem]) {
        groups[sem].push(c)
      } else {
        groups[sem] = [c]
      }
    })
    return groups
  }, [filteredCourses])

  // Handle Create Course
  const handleCreateCourse = async (e) => {
    e.preventDefault()
    if (!courseForm.code || !courseForm.name) {
      toast.error('Course Code and Name are required.')
      return
    }
    setSubmitting(true)
    try {
      await courseService.create({
        ...courseForm,
        code: courseForm.code.trim().toUpperCase(),
        credits: Number(courseForm.credits),
        semester: Number(courseForm.semester),
        facultyId: courseForm.facultyId ? Number(courseForm.facultyId) : null,
        departmentId: courseForm.departmentId ? Number(courseForm.departmentId) : null
      })
      toast.success(`Course ${courseForm.code.toUpperCase()} registered in curriculum!`)
      setShowAddModal(false)
      setCourseForm(initialForm)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course. Please verify code uniqueness.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Course
  const handleOpenEdit = (course) => {
    setEditingCourse(course)
    setCourseForm({
      code: course.code || '',
      name: course.name || '',
      description: course.description || '',
      credits: course.credits || 4,
      semester: course.semester || 1,
      sections: course.sections || 'A, B',
      duration: course.duration || '4 Years (8 Semesters)',
      facultyId: course.facultyId ? String(course.facultyId) : '',
      departmentId: course.departmentId ? String(course.departmentId) : '',
      status: course.status || 'ACTIVE'
    })
  }

  const handleUpdateCourse = async (e) => {
    e.preventDefault()
    if (!editingCourse) return
    setSubmitting(true)
    try {
      await courseService.update(editingCourse.id, {
        ...courseForm,
        code: courseForm.code.trim().toUpperCase(),
        credits: Number(courseForm.credits),
        semester: Number(courseForm.semester),
        facultyId: courseForm.facultyId ? Number(courseForm.facultyId) : null,
        departmentId: courseForm.departmentId ? Number(courseForm.departmentId) : null
      })
      toast.success(`Course ${courseForm.code.toUpperCase()} updated successfully!`)
      setEditingCourse(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update course.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Course
  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return
    try {
      await courseService.delete(deletingCourse.id)
      toast.success(`Course ${deletingCourse.code} removed from curriculum.`)
      setDeletingCourse(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete course.')
    }
  }

  return (
    <div
      className={`admin-courses-hub ${isFullscreen ? 'fullscreen-overlay-wrapper' : ''}`}
      style={isFullscreen ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg, #f8fafc)',
        overflowY: 'auto',
        padding: '24px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      } : { display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Fullscreen Floating Header Pill */}
      {isFullscreen && (
        <div className="fullscreen-indicator-pill">
          <span>⛶ Academic Curriculum Full Screen Mode</span>
          <button onClick={() => setIsFullscreen(false)} className="fullscreen-exit-btn">Exit (ESC)</button>
        </div>
      )}

      {/* ── 1. Enterprise Institutional Header ───────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1e40af 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.28)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: '#d99b26',
              color: '#0f172a',
              padding: '3px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.8,
              textTransform: 'uppercase'
            }}>
              Aditya University
            </span>
            <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
              Board of Studies &bull; Autonomous Academic Regulation (AR24)
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '2px 0 6px', color: '#fff', letterSpacing: -0.5 }}>
            Academic Courses &amp; Curricula
          </h1>
          <p style={{ fontSize: 13, color: '#93c5fd', margin: 0, maxWidth: 650, lineHeight: 1.5 }}>
            Central repository of undergraduate &amp; postgraduate course schemes, credit frameworks (L-T-P), faculty syllabus allocations, and branch-wise degree progression.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-ghost"
            style={{
              background: isFullscreen ? '#d99b26' : 'rgba(255,255,255,0.12)',
              color: isFullscreen ? '#0f172a' : '#fff',
              gap: 8,
              fontWeight: 800,
              padding: '10px 16px',
              borderRadius: 10
            }}
            title={isFullscreen ? 'Exit full screen (ESC)' : 'Expand to Horizontal Full Screen View'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'Exit Full Screen' : 'Horizontal Full Screen'}</span>
          </button>

          <button
            onClick={loadData}
            className="btn btn-ghost"
            style={{ color: '#fff', background: 'rgba(255,255,255,0.12)', gap: 6, padding: '10px 14px', borderRadius: 10 }}
            title="Refresh Courses"
          >
            <RefreshCw size={15} />
          </button>

          {viewMode === 'sections-matrix' ? (
            <button
              onClick={() => {
                setSectionForm(initialSectionForm)
                setShowAddSectionModal(true)
              }}
              className="btn btn-primary"
              style={{
                background: '#15803d',
                borderColor: '#16a34a',
                color: '#fff',
                fontWeight: 800,
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)'
              }}
            >
              <Plus size={16} />
              <span>Register New Section</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setCourseForm(initialForm)
                setShowAddModal(true)
              }}
              className="btn btn-primary"
              style={{
                background: '#15803d',
                borderColor: '#16a34a',
                color: '#fff',
                fontWeight: 800,
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)'
              }}
            >
              <Plus size={16} />
              <span>Add Academic Course</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Real-Time Curriculum Metrics (KPI Overview) ─────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16
      }}>
        <div className="card" style={{ padding: '18px 22px', borderRadius: 16, borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Courses Registered</span>
            <BookOpen size={18} style={{ color: '#2563eb' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '8px 0 2px' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
            {metrics.active} active syllabus schemes
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: 16, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Credits Value</span>
            <Award size={18} style={{ color: '#7c3aed' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#7c3aed', margin: '8px 0 2px' }}>
            {metrics.totalCredits}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Accumulated degree credits
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: 16, borderLeft: '4px solid #0f766e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Academic Departments</span>
            <Building size={18} style={{ color: '#0f766e' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f766e', margin: '8px 0 2px' }}>
            {departments.length || metrics.deptsCount}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Engineering &amp; Sciences
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: 16, borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Faculty Allocations</span>
            <Users size={18} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#d97706', margin: '8px 0 2px' }}>
            {metrics.facultyCoveragePct}%
          </div>
          <div style={{ fontSize: 12, color: metrics.facultyCoveragePct >= 90 ? '#16a34a' : '#d97706', fontWeight: 600 }}>
            Teaching staff assigned
          </div>
        </div>
      </div>

      {/* ── 3. High Visibility Horizontal Filter & View Mode Bar ───── */}
      <div className="card" style={{
        padding: '18px 24px',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 40, height: 42, borderRadius: 10, fontSize: 13 }}
              placeholder="Search by code (e.g. CS401), course title, faculty, or keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-secondary, #f1f5f9)',
            padding: 4,
            borderRadius: 10,
            gap: 4
          }}>
            <button
              onClick={() => setViewMode('horizontal-table')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'horizontal-table' ? '#1e3a8a' : 'transparent',
                color: viewMode === 'horizontal-table' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                borderRadius: 8,
                gap: 6
              }}
              title="Horizontal Full-Screen Matrix Table"
            >
              <LayoutList size={15} />
              <span>Horizontal Table</span>
            </button>

            <button
              onClick={() => setViewMode('horizontal-roadmap')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'horizontal-roadmap' ? '#1e3a8a' : 'transparent',
                color: viewMode === 'horizontal-roadmap' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                borderRadius: 8,
                gap: 6
              }}
              title="Horizontal 8-Semester Curriculum Track"
            >
              <Columns size={15} />
              <span>Semester Flow</span>
            </button>

            <button
              onClick={() => setViewMode('grid-cards')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'grid-cards' ? '#1e3a8a' : 'transparent',
                color: viewMode === 'grid-cards' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                borderRadius: 8,
                gap: 6
              }}
              title="Visual Course Cards Grid"
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>

            <button
              onClick={() => setViewMode('sections-matrix')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'sections-matrix' ? '#1e3a8a' : 'transparent',
                color: viewMode === 'sections-matrix' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                borderRadius: 8,
                gap: 6
              }}
              title="Academic Sections & Class Batches Allocation"
            >
              <Users size={15} />
              <span>Sections &amp; Batches</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Pills */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid var(--border-light, #f1f5f9)'
        }}>
          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Dept:</span>
            <select
              className="form-select"
              style={{ height: 34, fontSize: 12, borderRadius: 8, padding: '4px 10px', minWidth: 150 }}
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Semester:</span>
            <select
              className="form-select"
              style={{ height: 34, fontSize: 12, borderRadius: 8, padding: '4px 10px' }}
              value={semesterFilter}
              onChange={e => setSemesterFilter(e.target.value)}
            >
              <option value="ALL">All Semesters (1–8)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Section:</span>
            <select
              className="form-select"
              style={{ height: 34, fontSize: 12, borderRadius: 8, padding: '4px 10px', minWidth: 110 }}
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Credits Filter */}
          {viewMode !== 'sections-matrix' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Credits:</span>
              <select
                className="form-select"
                style={{ height: 34, fontSize: 12, borderRadius: 8, padding: '4px 10px' }}
                value={creditsFilter}
                onChange={e => setCreditsFilter(e.target.value)}
              >
                <option value="ALL">All Credits</option>
                <option value="1-2">1–2 Credits (Labs / Practicals)</option>
                <option value="3-4">3–4 Credits (Core Theory)</option>
                <option value="5+">5+ Credits (Project / Thesis)</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="form-select"
              style={{ height: 34, fontSize: 12, borderRadius: 8, padding: '4px 10px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || departmentFilter !== 'ALL' || semesterFilter !== 'ALL' || sectionFilter !== 'ALL' || creditsFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('')
                setDepartmentFilter('ALL')
                setSemesterFilter('ALL')
                setSectionFilter('ALL')
                setCreditsFilter('ALL')
                setStatusFilter('ALL')
              }}
              className="btn btn-ghost btn-sm"
              style={{ color: '#dc2626', fontSize: 11, fontWeight: 700, gap: 4 }}
            >
              <X size={13} /> Reset Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {viewMode === 'sections-matrix'
              ? <>Showing <strong>{filteredSections.length}</strong> of {sections.length} sections</>
              : <>Showing <strong>{filteredCourses.length}</strong> of {courses.length} courses</>
            }
          </div>
        </div>
      </div>

      {/* ── 4. Main Views ─────────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : viewMode === 'sections-matrix' ? (
        /* ── VIEW MODE D: ACADEMIC SECTIONS & CLASS BATCHES MATRIX ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 16
          }}>
            <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #1e3a8a' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL ACADEMIC SECTIONS</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '6px 0 2px' }}>
                {sections.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                Active class divisions across all programmes
              </div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #0f766e' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f766e' }}>LECTURE HALLS &amp; LABS</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0f766e', margin: '6px 0 2px' }}>
                {new Set(sections.map(s => s.roomNumber).filter(Boolean)).size}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                Assigned rooms &amp; research laboratories
              </div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706' }}>CLASS ADVISORS DESIGNATED</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '6px 0 2px' }}>
                {sections.filter(s => s.advisorId || s.advisorName).length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                Faculty coordinators guiding students
              </div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb' }}>TOTAL ENROLLED / CAPACITY</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', margin: '6px 0 2px' }}>
                {sections.reduce((acc, s) => acc + (s.enrolledCount || 0), 0)} / {sections.reduce((acc, s) => acc + (s.capacity || 60), 0)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                Admitted students across divisions
              </div>
            </div>
          </div>

          {/* Section Table Matrix */}
          {filteredSections.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
              <Users size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                No Academic Sections Found
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 460, margin: '0 auto 20px' }}>
                No sections match the current filters. Adjust your department/semester selection or register a new division.
              </p>
              <button
                onClick={() => {
                  setSectionForm(initialSectionForm)
                  setShowAddSectionModal(true)
                }}
                className="btn btn-primary"
                style={{ fontWeight: 700, gap: 6 }}
              >
                <Plus size={15} /> Register New Section
              </button>
            </div>
          ) : (
            <div className="card" style={{
              padding: 0,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid var(--border)'
            }}>
              <div className="table-container">
                <table className="data-table" style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 140 }}>Section Code</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 220 }}>Department</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 120 }}>Semester</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 100 }}>Section</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Lecture Room / Hall</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 220 }}>Class Advisor</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 170 }}>Student Strength</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 120 }}>Timetable</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right', width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSections.map(sec => {
                      const capacity = sec.capacity || 60
                      const enrolled = sec.enrolledCount || 0
                      const pct = Math.min(100, Math.round((enrolled / capacity) * 100))
                      return (
                        <tr
                          key={sec.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              borderRadius: 8,
                              background: '#eff6ff',
                              color: '#1e40af',
                              fontWeight: 800,
                              fontSize: 13,
                              fontFamily: 'monospace',
                              border: '1px solid #bfdbfe'
                            }}>
                              {sec.code}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              <Building size={14} style={{ color: '#0f766e', flexShrink: 0 }} />
                              <span>{sec.departmentName || 'General Engineering'}</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                              Academic Year {sec.academicYear || '2025-26'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span className="badge badge-neutral" style={{ fontSize: 12 }}>
                              Semester {sec.semester || 1}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span className="badge badge-primary" style={{ fontWeight: 800, fontSize: 12, padding: '4px 10px' }}>
                              Section {sec.sectionName || 'A'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#334155'
                              }}>
                                🏛 {sec.roomNumber || 'Room TBA'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              {sec.advisorName ? `Prof. ${sec.advisorName}` : <span style={{ color: '#d97706' }}>Not Assigned</span>}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              Class Advisor
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                              <span>{enrolled} / {capacity} Students</span>
                              <span>{pct}%</span>
                            </div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: pct >= 90 ? '#dc2626' : pct >= 70 ? '#16a34a' : '#2563eb',
                                borderRadius: 999
                              }} />
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <a
                              href={`/admin/timetable?courseId=1&semester=${sec.semester || 1}&section=${sec.sectionName || 'A'}`}
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#2563eb', gap: 4, padding: '4px 10px', textDecoration: 'none' }}
                            >
                              <Clock size={13} /> Schedule
                            </a>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                onClick={() => handleOpenEditSection(sec)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '6px 10px', color: '#d97706' }}
                                title="Edit section"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingSection(sec)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '6px 10px', color: '#dc2626' }}
                                title="Delete section"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
          <BookOpen size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
            No Academic Courses Found
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 460, margin: '0 auto 20px' }}>
            No courses match the active search and filter criteria. Adjust your filters or click below to register a new course in the curriculum.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ fontWeight: 700, gap: 6 }}>
            <Plus size={15} /> Add Academic Course
          </button>
        </div>
      ) : (
        <>
          {/* ── VIEW MODE A: HORIZONTAL FULL-SCREEN TABLE MATRIX ───────── */}
          {viewMode === 'horizontal-table' && (
            <div className="card" style={{
              padding: 0,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="data-table" style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 140 }}>Course Code</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Course Title &amp; Scheme</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 220 }}>Department</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 130 }}>Semester</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 110 }}>Sections</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 120 }}>Credits</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: 220 }}>Faculty In-Charge</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'center', width: 110 }}>Enrolled</th>
                      <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right', width: 150 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => {
                      const type = getCourseType(c)
                      return (
                        <tr
                          key={c.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Course Code */}
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              borderRadius: 8,
                              background: '#eff6ff',
                              color: '#1e40af',
                              fontWeight: 800,
                              fontSize: 13,
                              fontFamily: 'monospace',
                              letterSpacing: 0.5,
                              border: '1px solid #bfdbfe'
                            }}>
                              {c.code}
                            </span>
                            <div style={{ marginTop: 4 }}>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: type.bg,
                                color: type.color,
                                border: `1px solid ${type.border}`
                              }}>
                                {type.label}
                              </span>
                            </div>
                          </td>

                          {/* Course Title & Overview */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                              {c.name}
                            </div>
                            <p style={{
                              fontSize: 12,
                              color: '#64748b',
                              margin: '4px 0 0',
                              lineHeight: 1.4,
                              maxWidth: 360,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {c.description || 'Comprehensive syllabus modules covering fundamentals, design, and practical implementation.'}
                            </p>
                          </td>

                          {/* Department */}
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#334155'
                            }}>
                              <Building size={14} style={{ color: '#0f766e', flexShrink: 0 }} />
                              <span>{c.departmentName || 'General Engineering'}</span>
                            </span>
                          </td>

                          {/* Semester */}
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 700,
                              fontSize: 12
                            }}>
                              Semester {c.semester || 1}
                            </span>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                              Year {Math.ceil((c.semester || 1) / 2)}
                            </div>
                          </td>

                          {/* Sections */}
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <span className="badge badge-primary" style={{ fontWeight: 800, fontSize: 11 }}>
                              Sec {c.sections || 'A, B'}
                            </span>
                          </td>

                          {/* Credits */}
                          <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: '#faf5ff',
                                color: '#7c3aed',
                                border: '1px solid #e9d5ff',
                                fontWeight: 800,
                                fontSize: 13
                              }}>
                                {c.credits} Credits
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                              L-T-P: {c.credits - 1 > 0 ? c.credits - 1 : 1}-1-0
                            </div>
                          </td>

                          {/* Faculty In-Charge */}
                          <td style={{ padding: '16px 20px' }}>
                            {c.facultyName ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: '#0f766e',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: 12,
                                  flexShrink: 0
                                }}>
                                  {c.facultyName.slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Prof. {c.facultyName}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748b' }}>Course In-Charge</div>
                                </div>
                              </div>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: '#fffbeb',
                                color: '#b45309',
                                fontSize: 12,
                                fontWeight: 700
                              }}>
                                <AlertTriangle size={13} /> Unassigned
                              </span>
                            )}
                          </td>

                          {/* Enrolled Count */}
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 8,
                              background: '#f8fafc',
                              color: '#0f172a',
                              fontWeight: 700,
                              fontSize: 12,
                              border: '1px solid #e2e8f0'
                            }}>
                              <Users size={13} style={{ color: '#2563eb' }} />
                              {c.studentCount != null ? c.studentCount : '64'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                onClick={() => setDetailCourse(c)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '6px 8px', borderRadius: 8, color: '#2563eb' }}
                                title="View syllabus & details"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '6px 8px', borderRadius: 8, color: '#d97706' }}
                                title="Edit course"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingCourse(c)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '6px 8px', borderRadius: 8, color: '#dc2626' }}
                                title="Delete course"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VIEW MODE B: HORIZONTAL 8-SEMESTER DEGREE ROADMAP ─────── */}
          {viewMode === 'horizontal-roadmap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Horizontal Degree Progression Track &bull; Semesters 1 to 8 (Scroll Horizontally &rarr;)
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Total Curriculum Credits: <strong>{metrics.totalCredits}</strong>
                </span>
              </div>

              {/* Horizontal Scrollable Track */}
              <div style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                paddingBottom: 16,
                WebkitOverflowScrolling: 'touch'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                  const semCourses = semesterGroups[sem] || []
                  const semCredits = semCourses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0)

                  return (
                    <div
                      key={sem}
                      style={{
                        minWidth: 290,
                        maxWidth: 320,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Semester Column Header */}
                      <div style={{
                        padding: '14px 18px',
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 900 }}>Semester {sem}</div>
                          <div style={{ fontSize: 11, opacity: 0.85 }}>Year {Math.ceil(sem / 2)}</div>
                        </div>
                        <span style={{
                          background: 'rgba(255,255,255,0.2)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800
                        }}>
                          {semCredits} Credits
                        </span>
                      </div>

                      {/* Course List in Semester */}
                      <div style={{
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        flex: 1,
                        background: '#f8fafc',
                        maxHeight: 520,
                        overflowY: 'auto'
                      }}>
                        {semCourses.length === 0 ? (
                          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                            No courses in Semester {sem}
                          </div>
                        ) : (
                          semCourses.map(c => {
                            const type = getCourseType(c)
                            return (
                              <div
                                key={c.id}
                                style={{
                                  background: '#fff',
                                  padding: 12,
                                  borderRadius: 12,
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: 12,
                                    color: '#1e40af',
                                    background: '#eff6ff',
                                    padding: '2px 6px',
                                    borderRadius: 4
                                  }}>
                                    {c.code}
                                  </span>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>
                                    {c.credits} Cr
                                  </span>
                                </div>

                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                                  {c.name}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                  <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.facultyName ? `Prof. ${c.facultyName}` : 'Unassigned'}
                                  </span>
                                  <button
                                    onClick={() => setDetailCourse(c)}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}
                                  >
                                    View &rarr;
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── VIEW MODE C: MODERN VISUAL COURSE CARDS ───────────────── */}
          {viewMode === 'grid-cards' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20
            }}>
              {filteredCourses.map(c => {
                const type = getCourseType(c)
                return (
                  <div
                    key={c.id}
                    className="card card-hover"
                    style={{
                      borderRadius: 16,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      border: '1px solid var(--border)',
                      position: 'relative'
                    }}
                  >
                    {/* Top Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: '#eff6ff',
                        color: '#1e40af',
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        border: '1px solid #bfdbfe'
                      }}>
                        {c.code}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: '#faf5ff',
                        color: '#7c3aed',
                        fontWeight: 800,
                        fontSize: 12
                      }}>
                        {c.credits} Credits
                      </span>
                    </div>

                    {/* Course Title */}
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>
                        {c.name}
                      </h3>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: type.bg,
                          color: type.color,
                          border: `1px solid ${type.border}`
                        }}>
                          {type.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          Semester {c.semester || 1} &bull; {c.departmentName || 'Engineering'}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: 12,
                      color: '#64748b',
                      margin: 0,
                      lineHeight: 1.5,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {c.description || 'Comprehensive university course syllabus covering theoretical foundation, applied laboratory sessions, and engineering evaluations.'}
                    </p>

                    {/* Faculty & Footer */}
                    <div style={{
                      paddingTop: 12,
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>
                        {c.facultyName ? `Prof. ${c.facultyName}` : <span style={{ color: '#d97706' }}>Unassigned</span>}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setDetailCourse(c)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#2563eb' }}
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#d97706' }}
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── 5. Academic Departments Directory ────────────────────────── */}
      <div style={{ marginTop: 12 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14
        }}>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>
              Academic Departments &amp; Schools ({departments.length})
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Academic departments offering programs, degrees, and course curricula at Aditya University.
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569' }}>Dept Code</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569' }}>Department Name</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569' }}>Head of Department (HOD)</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569' }}>Offered Courses</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => {
                  const deptCourseCount = courses.filter(c => String(c.departmentId) === String(d.id) || (c.departmentName && c.departmentName.toLowerCase() === d.name.toLowerCase())).length
                  return (
                    <tr key={d.id}>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: '#1e40af', fontFamily: 'monospace' }}>
                        {d.code}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                        {d.name}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569', fontWeight: 600 }}>
                        {d.headOfDepartment || 'To be nominated by Dean'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                          {deptCourseCount} Active Courses
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          {d.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL A: ADD COURSE MODAL ──────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Academic Course into Curriculum"
        size="md"
      >
        <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Enter official course credentials as approved by the Academic Council &amp; Board of Studies.
          </p>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                className="form-input"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                value={courseForm.code}
                onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                required
                placeholder="e.g. CS401, AI302"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Credits Value (1–10) *</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="10"
                value={courseForm.credits}
                onChange={e => setCourseForm({ ...courseForm, credits: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course Title *</label>
            <input
              className="form-input"
              value={courseForm.name}
              onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
              required
              placeholder="e.g. Cloud Computing & Distributed Systems"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Semester (1–8) *</label>
              <select
                className="form-select"
                value={courseForm.semester}
                onChange={e => setCourseForm({ ...courseForm, semester: e.target.value })}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s} (Year {Math.ceil(s / 2)})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={courseForm.departmentId}
                onChange={e => setCourseForm({ ...courseForm, departmentId: e.target.value })}
                required
              >
                <option value="">Select Offering Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Faculty In-Charge / Course Coordinator</label>
            <select
              className="form-select"
              value={courseForm.facultyId}
              onChange={e => setCourseForm({ ...courseForm, facultyId: e.target.value })}
            >
              <option value="">Select Faculty Member (Optional)</option>
              {faculty.map(f => (
                <option key={f.id} value={f.id}>Prof. {f.name} ({f.department || 'Faculty'})</option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Applicable Sections / Batches</label>
              <input
                className="form-input"
                value={courseForm.sections || 'A, B'}
                onChange={e => setCourseForm({ ...courseForm, sections: e.target.value })}
                placeholder="e.g. A, B or A, B, C"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Course Status</label>
              <select
                className="form-select"
                value={courseForm.status || 'ACTIVE'}
                onChange={e => setCourseForm({ ...courseForm, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Syllabus Overview &amp; Learning Objectives</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={courseForm.description}
              onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
              placeholder="Detailed syllabus outline, prerequisite knowledge, and course outcomes..."
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ fontWeight: 800, gap: 6 }}
            >
              {submitting ? <Spinner size="sm" /> : <Plus size={16} />}
              <span>Register Course</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL B: EDIT COURSE MODAL ─────────────────────────────── */}
      <Modal
        isOpen={Boolean(editingCourse)}
        onClose={() => setEditingCourse(null)}
        title={`Edit Course: ${editingCourse?.code || ''}`}
        size="md"
      >
        <form onSubmit={handleUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                className="form-input"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                value={courseForm.code}
                onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Credits *</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="10"
                value={courseForm.credits}
                onChange={e => setCourseForm({ ...courseForm, credits: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course Name *</label>
            <input
              className="form-input"
              value={courseForm.name}
              onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select
                className="form-select"
                value={courseForm.semester}
                onChange={e => setCourseForm({ ...courseForm, semester: e.target.value })}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={courseForm.departmentId}
                onChange={e => setCourseForm({ ...courseForm, departmentId: e.target.value })}
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Faculty In-Charge</label>
              <select
                className="form-select"
                value={courseForm.facultyId}
                onChange={e => setCourseForm({ ...courseForm, facultyId: e.target.value })}
              >
                <option value="">Select Faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>Prof. {f.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={courseForm.status}
                onChange={e => setCourseForm({ ...courseForm, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Applicable Sections / Batches</label>
            <input
              className="form-input"
              value={courseForm.sections || 'A, B'}
              onChange={e => setCourseForm({ ...courseForm, sections: e.target.value })}
              placeholder="e.g. A, B or A, B, C"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Syllabus</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={courseForm.description}
              onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditingCourse(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ fontWeight: 800 }}
            >
              {submitting ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL C: VIEW COURSE DETAILS / SYLLABUS MODAL ─────────── */}
      {detailCourse && (
        <Modal
          isOpen={Boolean(detailCourse)}
          onClose={() => setDetailCourse(null)}
          title={`Curriculum Specification: ${detailCourse.code}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#eff6ff',
                  color: '#1e40af',
                  fontWeight: 900,
                  fontSize: 14,
                  fontFamily: 'monospace'
                }}>
                  {detailCourse.code}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#faf5ff',
                  color: '#7c3aed',
                  fontWeight: 800,
                  fontSize: 13
                }}>
                  {detailCourse.credits} Credits
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                {detailCourse.name}
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Department of {detailCourse.departmentName || 'General Engineering'} &bull; Semester {detailCourse.semester || 1}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Assigned Faculty</span>
                <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {detailCourse.facultyName ? `Prof. ${detailCourse.facultyName}` : 'Unassigned'}
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Applicable Sections</span>
                <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#1e3a8a' }}>
                  Sec {detailCourse.sections || 'A, B'}
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #edf2f7' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Course Scheme</span>
                <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {detailCourse.duration || '4 Years (8 Sem)'}
                </p>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Syllabus Outline &amp; Course Description
              </h4>
              <p style={{
                fontSize: 13,
                color: '#475569',
                lineHeight: 1.6,
                margin: 0,
                background: '#f8fafc',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}>
                {detailCourse.description || 'No detailed description provided for this course. Please contact the Head of Department for the official syllabus document.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
              <button
                onClick={() => setDetailCourse(null)}
                className="btn btn-ghost"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const toEdit = detailCourse
                  setDetailCourse(null)
                  handleOpenEdit(toEdit)
                }}
                className="btn btn-primary"
                style={{ fontWeight: 700, gap: 6 }}
              >
                <Edit3 size={15} /> Edit Course
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL D: DELETE CONFIRMATION ──────────────────────────── */}
      {deletingCourse && (
        <Modal
          isOpen={Boolean(deletingCourse)}
          onClose={() => setDeletingCourse(null)}
          title="Confirm Course Deletion"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#dc2626' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Are you sure you want to remove this course from the university curriculum?
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Course <strong>{deletingCourse.code} — {deletingCourse.name}</strong> will be permanently removed. Any enrolled students will have this course detached from their current semester ledger.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
              <button
                onClick={() => setDeletingCourse(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn"
                style={{ background: '#dc2626', color: '#fff', fontWeight: 800 }}
              >
                Delete Course
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL E: REGISTER NEW SECTION ───────────────────────── */}
      {showAddSectionModal && (
        <Modal
          isOpen={showAddSectionModal}
          onClose={() => setShowAddSectionModal(false)}
          title="Register New Academic Section & Batch Division"
          size="md"
        >
          <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  className="form-select"
                  value={sectionForm.departmentId}
                  onChange={e => setSectionForm({ ...sectionForm, departmentId: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Semester (1–8) *</label>
                <select
                  className="form-select"
                  value={sectionForm.semester}
                  onChange={e => setSectionForm({ ...sectionForm, semester: e.target.value })}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Section Letter *</label>
                <select
                  className="form-select"
                  value={sectionForm.sectionName}
                  onChange={e => setSectionForm({ ...sectionForm, sectionName: e.target.value })}
                  required
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Section Code (Optional)</label>
                <input
                  className="form-input"
                  value={sectionForm.code}
                  onChange={e => setSectionForm({ ...sectionForm, code: e.target.value })}
                  placeholder="Auto-derived e.g. CSE-4A"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Lecture Hall / Lab Room *</label>
                <input
                  className="form-input"
                  value={sectionForm.roomNumber}
                  onChange={e => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
                  placeholder="e.g. Newton Block Room 301"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student Capacity (Default 60)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="120"
                  value={sectionForm.capacity}
                  onChange={e => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Class Advisor / Faculty Coordinator</label>
              <select
                className="form-select"
                value={sectionForm.advisorId}
                onChange={e => setSectionForm({ ...sectionForm, advisorId: e.target.value })}
              >
                <option value="">Select Faculty Advisor (Optional)</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>Prof. {f.name} ({f.department || 'Faculty'})</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input
                  className="form-input"
                  value={sectionForm.academicYear}
                  onChange={e => setSectionForm({ ...sectionForm, academicYear: e.target.value })}
                  placeholder="2025-26"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={sectionForm.status}
                  onChange={e => setSectionForm({ ...sectionForm, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddSectionModal(false)}
                disabled={sectionSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sectionSubmitting}
                style={{ fontWeight: 800, gap: 6 }}
              >
                <Plus size={16} />
                {sectionSubmitting ? 'Registering...' : 'Register Section'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL F: EDIT SECTION ─────────────────────────────────── */}
      {editingSection && (
        <Modal
          isOpen={Boolean(editingSection)}
          onClose={() => setEditingSection(null)}
          title={`Edit Academic Section (${editingSection.code})`}
          size="md"
        >
          <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={sectionForm.departmentId}
                  onChange={e => setSectionForm({ ...sectionForm, departmentId: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Semester</label>
                <select
                  className="form-select"
                  value={sectionForm.semester}
                  onChange={e => setSectionForm({ ...sectionForm, semester: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Section Letter</label>
                <select
                  className="form-select"
                  value={sectionForm.sectionName}
                  onChange={e => setSectionForm({ ...sectionForm, sectionName: e.target.value })}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Lecture Hall / Room</label>
                <input
                  className="form-input"
                  value={sectionForm.roomNumber}
                  onChange={e => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Student Capacity</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="120"
                  value={sectionForm.capacity}
                  onChange={e => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={sectionForm.status}
                  onChange={e => setSectionForm({ ...sectionForm, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Class Advisor</label>
              <select
                className="form-select"
                value={sectionForm.advisorId}
                onChange={e => setSectionForm({ ...sectionForm, advisorId: e.target.value })}
              >
                <option value="">Select Faculty Member</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>Prof. {f.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditingSection(null)}
                disabled={sectionSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sectionSubmitting}
                style={{ fontWeight: 800, gap: 6 }}
              >
                <Edit3 size={16} />
                {sectionSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL G: DELETE SECTION CONFIRMATION ──────────────────── */}
      {deletingSection && (
        <Modal
          isOpen={Boolean(deletingSection)}
          onClose={() => setDeletingSection(null)}
          title="Confirm Section Removal"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#dc2626' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Are you sure you want to remove section {deletingSection.code}?
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Division <strong>{deletingSection.code} ({deletingSection.departmentName || 'Dept'}, Sem {deletingSection.semester})</strong> will be removed. Student enrollment records and historical attendances will be safely preserved.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
              <button
                onClick={() => setDeletingSection(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSectionConfirm}
                className="btn"
                style={{ background: '#dc2626', color: '#fff', fontWeight: 800 }}
              >
                Remove Section
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
