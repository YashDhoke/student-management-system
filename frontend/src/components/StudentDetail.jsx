import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService, markService } from '../services/api';

const StudentDetail = ({ showToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mark Form Modal state
  const [markFormOpen, setMarkFormOpen] = useState(false);
  const [selectedMark, setSelectedMark] = useState(null);
  const [markFormData, setMarkFormData] = useState({
    subject: '',
    score: '',
    max_score: '100',
    exam_type: 'final',
  });
  const [markErrors, setMarkErrors] = useState({});
  const [submittingMark, setSubmittingMark] = useState(false);

  // Delete Mark State
  const [deleteMarkId, setDeleteMarkId] = useState(null);
  const [deletingMark, setDeletingMark] = useState(false);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const result = await studentService.getStudentById(id);
      setStudent(result.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to fetch student profile.', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  // Calculate statistics
  const marks = student?.marks || [];
  const totalExams = marks.length;
  
  const averageScore = totalExams > 0 
    ? (marks.reduce((acc, curr) => acc + curr.score, 0) / totalExams).toFixed(2)
    : '—';

  const getPerformanceTier = (avg) => {
    if (avg === '—') return 'No Exams';
    const num = parseFloat(avg);
    if (num >= 90) return 'Distinction (A)';
    if (num >= 80) return 'Excellent (B)';
    if (num >= 70) return 'Average (C)';
    if (num >= 50) return 'Pass (D)';
    return 'Fail (F)';
  };

  const performanceTier = getPerformanceTier(averageScore);

  const handleOpenMarkModal = (mark = null) => {
    if (mark) {
      setSelectedMark(mark);
      setMarkFormData({
        subject: mark.subject,
        score: mark.score.toString(),
        max_score: mark.max_score.toString(),
        exam_type: mark.exam_type,
      });
    } else {
      setSelectedMark(null);
      setMarkFormData({
        subject: '',
        score: '',
        max_score: '100',
        exam_type: 'final',
      });
    }
    setMarkErrors({});
    setMarkFormOpen(true);
  };

  const handleMarkChange = (e) => {
    const { name, value } = e.target;
    setMarkFormData((prev) => ({ ...prev, [name]: value }));
    if (markErrors[name]) {
      setMarkErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateMark = () => {
    const errors = {};
    if (!markFormData.subject.trim()) errors.subject = 'Subject is required.';
    
    if (markFormData.score === '') {
      errors.score = 'Score is required.';
    } else {
      const s = Number(markFormData.score);
      if (isNaN(s) || s < 0 || s > 100) {
        errors.score = 'Score must be a number between 0 and 100.';
      }
    }

    if (markFormData.max_score === '') {
      errors.max_score = 'Maximum score is required.';
    } else {
      const ms = Number(markFormData.max_score);
      if (isNaN(ms) || ms <= 0) {
        errors.max_score = 'Maximum score must be positive.';
      }
    }

    if (!markFormData.exam_type.trim()) {
      errors.exam_type = 'Exam type is required.';
    }

    setMarkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    if (!validateMark()) return;

    setSubmittingMark(true);
    try {
      if (selectedMark) {
        // Edit mark
        await markService.updateMark(selectedMark.id, {
          subject: markFormData.subject,
          score: parseFloat(markFormData.score),
          max_score: parseFloat(markFormData.max_score),
          exam_type: markFormData.exam_type,
        });
        showToast('Academic marks updated successfully.', 'success');
      } else {
        // Add mark
        await markService.addMark(id, {
          subject: markFormData.subject,
          score: parseFloat(markFormData.score),
          max_score: parseFloat(markFormData.max_score),
          exam_type: markFormData.exam_type,
        });
        showToast('Academic marks recorded successfully.', 'success');
      }
      setMarkFormOpen(false);
      fetchStudentDetails();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 409) {
        setMarkErrors({ subject: 'Duplicate subject and exam type combination found for this student.' });
      } else {
        showToast(err.response?.data?.message || 'Failed to submit mark details.', 'error');
      }
    } finally {
      setSubmittingMark(false);
    }
  };

  const handleConfirmDeleteMark = async () => {
    setDeletingMark(true);
    try {
      await markService.deleteMark(deleteMarkId);
      showToast('Mark record deleted successfully.', 'success');
      setDeleteMarkId(null);
      fetchStudentDetails();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete mark record.', 'error');
    } finally {
      setDeletingMark(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
        <p className="text-gray-400 text-sm mt-4">Loading student profile...</p>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white transition-all text-sm"
        >
          ← Back to Directory
        </button>

        <h2 className="text-sm font-mono text-gray-500">Student Profile #{student.id}</h2>
      </div>

      {/* Main Student Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-indigo-500/20 mb-4">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-violet-400 text-sm font-medium mt-1">{student.email}</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div>
              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Phone</span>
              <span className="text-white text-sm mt-0.5 block">{student.phone || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Date of Birth</span>
              <span className="text-white text-sm mt-0.5 block">
                {student.date_of_birth
                  ? new Date(student.date_of_birth).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Enrollment Date</span>
              <span className="text-white text-sm mt-0.5 block">
                {student.enrollment_date
                  ? new Date(student.enrollment_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat CARD 1 */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Average Score</span>
            <div className="my-4">
              <span className="text-5xl font-black text-white">{averageScore}</span>
              {averageScore !== '—' && <span className="text-gray-400 font-medium text-lg"> / 100</span>}
            </div>
            <div className="text-xs text-gray-500">Overall class performance indicator</div>
          </div>

          {/* Stat CARD 2 */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Exams Completed</span>
            <div className="my-4">
              <span className="text-5xl font-black text-white">{totalExams}</span>
              <span className="text-gray-400 font-medium text-lg"> subjects</span>
            </div>
            <div className="text-xs text-gray-500">Total verified mark sheets</div>
          </div>

          {/* Stat CARD 3 */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Performance Tier</span>
            <div className="my-4">
              <span className="text-2xl font-black text-indigo-300 block">{performanceTier}</span>
            </div>
            <div className="text-xs text-gray-500">Based on GPA boundaries</div>
          </div>
        </div>
      </div>

      {/* Marks Management Listing */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/2">
          <div>
            <h3 className="text-lg font-bold text-white">Academic Marksheets</h3>
            <p className="text-xs text-gray-400 mt-0.5">View details, grade performance, and edit subject marks.</p>
          </div>

          <button
            onClick={() => handleOpenMarkModal(null)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-lg shadow-violet-500/25 transition-all"
          >
            <span>＋</span> Record Mark
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {marks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <span className="text-3xl mb-3">🎓</span>
              <h4 className="text-sm font-semibold text-white">No Marks Recorded</h4>
              <p className="text-gray-400 text-xs max-w-xs mt-1">
                There are currently no examination scores logged for this student profile.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-[10px] font-semibold uppercase tracking-wider bg-white/1">
                  <th className="py-4.5 px-6">Subject</th>
                  <th className="py-4.5 px-6">Score</th>
                  <th className="py-4.5 px-6">Max Score</th>
                  <th className="py-4.5 px-6">Percentage</th>
                  <th className="py-4.5 px-6">Exam Type</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {marks.map((m) => {
                  const percentage = ((m.score / m.max_score) * 100).toFixed(1);
                  return (
                    <tr key={m.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">{m.subject}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className="text-white font-mono font-medium">{m.score}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400 font-mono">{m.max_score}</td>
                      <td className="py-4 px-6 text-sm">
                        <span
                          className={`font-semibold ${
                            parseFloat(percentage) >= 75
                              ? 'text-emerald-400'
                              : parseFloat(percentage) >= 50
                              ? 'text-yellow-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold uppercase tracking-widest text-gray-300">
                        <span className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          {m.exam_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenMarkModal(m)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border border-violet-500/10 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setDeleteMarkId(m.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/10 transition-colors"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mark Entry Modal Form */}
      {markFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {selectedMark ? 'Edit Academic Mark' : 'Record Academic Mark'}
              </h3>
              <button
                onClick={() => setMarkFormOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMarkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={markFormData.subject}
                  onChange={handleMarkChange}
                  disabled={!!selectedMark} // Subject usually static on edit, or changeable
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
                  placeholder="Mathematics"
                />
                {markErrors.subject && <p className="text-rose-400 text-xs mt-1">{markErrors.subject}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Score (0 - 100) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="score"
                    value={markFormData.score}
                    onChange={handleMarkChange}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                    placeholder="92.5"
                  />
                  {markErrors.score && <p className="text-rose-400 text-xs mt-1">{markErrors.score}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Max Score *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="max_score"
                    value={markFormData.max_score}
                    onChange={handleMarkChange}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                    placeholder="100"
                  />
                  {markErrors.max_score && <p className="text-rose-400 text-xs mt-1">{markErrors.max_score}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Exam Type *
                </label>
                <input
                  type="text"
                  name="exam_type"
                  value={markFormData.exam_type}
                  onChange={handleMarkChange}
                  disabled={!!selectedMark}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
                  placeholder="final"
                />
                {markErrors.exam_type && <p className="text-rose-400 text-xs mt-1">{markErrors.exam_type}</p>}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setMarkFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMark}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {submittingMark ? 'Saving...' : 'Save Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Mark Confirmation Modal */}
      {deleteMarkId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Mark Entry</h3>
            <p className="text-gray-300 text-sm mb-6">
              Are you sure you want to remove this academic mark entry?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteMarkId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteMark}
                disabled={deletingMark}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {deletingMark ? 'Deleting...' : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
