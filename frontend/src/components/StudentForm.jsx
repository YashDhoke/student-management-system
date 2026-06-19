import React, { useState, useEffect } from 'react';
import { studentService } from '../services/api';

const StudentForm = ({ student, onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    enrollment_date: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      // Format dates correctly for HTML input type="date"
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
      };

      setFormData({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        phone: student.phone || '',
        date_of_birth: formatDate(student.date_of_birth),
        enrollment_date: formatDate(student.enrollment_date),
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required.';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      if (isNaN(dob.getTime())) {
        newErrors.date_of_birth = 'Please select a valid date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let savedData;
      if (student?.id) {
        // Update existing student
        const response = await studentService.updateStudent(student.id, formData);
        savedData = response.data;
        showToast('Student updated successfully!', 'success');
      } else {
        // Create new student
        const response = await studentService.createStudent(formData);
        savedData = response.data;
        showToast('Student created successfully!', 'success');
      }
      onSave(savedData);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response && err.response.status === 409) {
        setErrors({ email: err.response.data.message || 'Email already exists.' });
      } else {
        showToast(err.response?.data?.message || 'Something went wrong.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all duration-300 transform scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-sans text-white">
            {student ? 'Edit Student Details' : 'Add New Student'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                placeholder="John"
              />
              {errors.first_name && <p className="text-rose-400 text-xs mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                placeholder="Doe"
              />
              {errors.last_name && <p className="text-rose-400 text-xs mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              placeholder="john.doe@example.com"
            />
            {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              placeholder="+1234567890"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              />
              {errors.date_of_birth && <p className="text-rose-400 text-xs mt-1">{errors.date_of_birth}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Enrollment Date</label>
              <input
                type="date"
                name="enrollment_date"
                value={formData.enrollment_date}
                onChange={handleChange}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
