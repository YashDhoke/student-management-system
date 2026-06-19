import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import StudentForm from './StudentForm';

const StudentList = ({ showToast }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const result = await studentService.getStudents(page, limit);
      setStudents(result.data || []);
      setMeta(result.meta || { currentPage: page, totalPages: 1, totalRecords: 0, limit });
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to fetch students.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, limit]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < meta.totalPages) setPage(page + 1);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };

  const handleAddClick = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  const handleFormSave = () => {
    setFormOpen(false);
    fetchStudents();
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(deleteConfirmId);
      showToast('Student deleted successfully!', 'success');
      setDeleteConfirmId(null);
      // Reset to page 1 if current page becomes empty
      if (students.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete student.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Perform client-side filtering on names/emails based on search query
  const filteredStudents = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const email = s.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 glass-panel rounded-2xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Student <span className="gradient-text">Registry</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage student directories, update registration details, and record assessment marks.
          </p>
        </div>

        <button
          onClick={handleAddClick}
          className="self-start md:self-center flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>＋</span> Add Student
        </button>
      </div>

      {/* Main Content Card */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-b border-white/5 bg-white/2">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Per Page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="glass-input px-3 py-2 rounded-xl text-sm font-medium text-white appearance-none cursor-pointer"
            >
              <option value="5" className="bg-slate-900">5</option>
              <option value="10" className="bg-slate-900">10</option>
              <option value="20" className="bg-slate-900">20</option>
            </select>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(limit)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center animate-pulse">
                  <div className="h-10 bg-white/5 rounded-lg w-12" />
                  <div className="h-10 bg-white/5 rounded-lg flex-1" />
                  <div className="h-10 bg-white/5 rounded-lg w-32" />
                  <div className="h-10 bg-white/5 rounded-lg w-20" />
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <span className="text-4xl mb-4">📭</span>
              <h3 className="text-lg font-semibold text-white">No Students Found</h3>
              <p className="text-gray-400 text-sm max-w-sm mt-1">
                {searchQuery
                  ? "We couldn't find any student matching your query. Try adjusting your keywords."
                  : 'Get started by creating the first student record.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-white/1">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Full Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Enrollment Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-white/3 transition-colors group"
                  >
                    <td className="py-4.5 px-6 font-mono text-xs text-gray-400">
                      #{student.id}
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                        {student.first_name} {student.last_name}
                      </div>
                    </td>
                    <td className="py-4.5 px-6 text-sm text-gray-300">
                      {student.email}
                    </td>
                    <td className="py-4.5 px-6 text-sm text-gray-300">
                      {student.phone || '—'}
                    </td>
                    <td className="py-4.5 px-6 text-sm text-gray-300">
                      {student.enrollment_date
                        ? new Date(student.enrollment_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-200 transition-colors"
                          title="View student profile & marks"
                        >
                          👁 Profile
                        </button>
                        <button
                          onClick={() => handleEditClick(student)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border border-violet-500/10 transition-colors"
                          title="Edit student"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/10 transition-colors"
                          title="Delete student"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredStudents.length > 0 && !loading && (
          <div className="flex items-center justify-between p-5 border-t border-white/5 bg-white/1">
            <span className="text-xs text-gray-400">
              Showing page <strong className="text-white">{meta.currentPage}</strong> of{' '}
              <strong className="text-white">{meta.totalPages || 1}</strong> (
              <strong className="text-white">{meta.totalRecords}</strong> records total)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ◀ Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={page >= meta.totalPages}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {formOpen && (
        <StudentForm
          student={selectedStudent}
          onClose={() => setFormOpen(false)}
          onSave={handleFormSave}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Student Record</h3>
            <p className="text-gray-300 text-sm mb-6">
              Are you sure you want to delete this student? This action is permanent and will delete
              all academic marks associated with this student.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
