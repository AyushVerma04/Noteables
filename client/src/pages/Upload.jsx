import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Economics', 'Psychology', 'Engineering',
  'Accounting', 'Law', 'Medicine', 'Philosophy', 'Sociology',
];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [unit, setUnit] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'ppt', 'pptx'].includes(ext)) {
      toast.error('Only PDF and PPT files are accepted');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50MB');
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const getFileType = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    return ext === 'pdf' ? 'pdf' : 'ppt';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !year || !semester || !subject || !teacher || !unit) {
      return toast.error('Please fill in all fields and select a file');
    }

    setUploading(true);
    setProgress(10);

    try {
      // Step 1: Get presigned URL
      const { data } = await API.post('/upload/generate-url', {
        title,
        fileType: getFileType(file.name),
        year: Number(year),
        semester: Number(semester),
        subject,
        teacher,
        unit: Number(unit),
        fileName: file.name,
      });

      setProgress(40);

      // Step 2: Upload file directly to Supabase via presigned URL
      await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      setProgress(90);

      toast.success('Upload successful! Your note is pending admin review.');
      setProgress(100);

      // Reset form
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setYear('');
        setSemester('');
        setSubject('');
        setTeacher('');
        setUnit('');
        setProgress(0);
        setUploading(false);
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  const semesters = year ? [1, 2, 3, 4, 5, 6, 7, 8].slice(0, Number(year) * 2) : [];

  return (
    <div className="upload-page">
      <h1>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', verticalAlign: 'middle', marginRight: 8 }}>cloud_upload</span>
        Upload Notes
      </h1>
      <p className="subtitle">Share your academic materials with the community. All uploads go through admin approval.</p>

      <form onSubmit={handleSubmit}>
        {/* Dropzone */}
        <div
          className={`dropzone ${dragActive ? 'active' : ''} ${file ? 'active' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          id="upload-dropzone"
        >
          {file ? (
            <>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>check_circle</span>
              <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{file.name}</p>
              <p className="file-types">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">upload_file</span>
              <p>Drag and drop your file here, or click to browse</p>
              <p className="file-types">Accepted: PDF, PPT, PPTX • Max 50MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.ppt,.pptx"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Metadata Form */}
        <div className="metadata-form">
          <div className="input-group full-width">
            <label>Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              id="upload-title"
            />
          </div>

          <div className="input-group">
            <label>Year</label>
            <select
              className="select-field"
              value={year}
              onChange={(e) => { setYear(e.target.value); setSemester(''); }}
              id="upload-year"
            >
              <option value="">Select Year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div className="input-group">
            <label>Semester</label>
            <select
              className="select-field"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              disabled={!year}
              id="upload-semester"
            >
              <option value="">Select Semester</option>
              {semesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Subject</label>
            <select
              className="select-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              id="upload-subject"
            >
              <option value="">Select Subject</option>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Teacher</label>
            <input
              type="text"
              className="input-field"
              placeholder="Prof. name..."
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              id="upload-teacher"
            />
          </div>

          <div className="input-group">
            <label>Unit</label>
            <select
              className="select-field"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              id="upload-unit"
            >
              <option value="">Select Unit</option>
              {[1,2,3,4,5,6,7,8].map(u => (
                <option key={u} value={u}>Unit {u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="upload-progress">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="body-sm text-variant">Uploading...</span>
              <span className="body-sm text-primary">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          style={{ marginTop: 'var(--space-xl)' }}
          disabled={uploading}
          id="upload-submit"
        >
          {uploading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
              Uploading...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">cloud_upload</span>
              Submit for Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}
