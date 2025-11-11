import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { certificatesAPI, examsAPI } from '../api';

const BulkCertificateGenerator = () => {
  const [selectedExam, setSelectedExam] = useState('');
  const [exams, setExams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await examsAPI.getExams();
      setExams(response.data);
    } catch (error) {
      console.error('Failed to load exams:', error);
      setError('Failed to load exams');
    }
  };

  const handleExamChange = async (examId) => {
    setSelectedExam(examId);
    setParticipants([]);
    setResults(null);

    if (examId) {
      try {
        const exam = exams.find(e => e._id === examId);
        if (exam && exam.participants) {
          // Get participant details
          const participantDetails = await Promise.all(
            exam.participants
              .filter(p => p.status === 'completed')
              .map(async (participant) => {
                try {
                  // In a real app, you'd have an endpoint to get user details
                  // For now, we'll use placeholder data
                  return {
                    studentId: participant.user,
                    name: `Student ${participant.user.slice(-4)}`, // Placeholder
                    score: participant.score || 0,
                    email: `student${participant.user.slice(-4)}@example.com` // Placeholder
                  };
                } catch (error) {
                  console.error('Failed to get participant details:', error);
                  return null;
                }
              })
          );

          setParticipants(participantDetails.filter(p => p !== null));
        }
      } catch (error) {
        console.error('Failed to load participants:', error);
        setError('Failed to load exam participants');
      }
    }
  };

  const handleGenerateCertificates = async () => {
    if (!selectedExam || participants.length === 0) {
      setError('Please select an exam with completed participants');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const data = {
        examId: selectedExam,
        participants: participants.map(p => ({
          studentId: p.studentId,
          score: p.score
        }))
      };

      const response = await certificatesAPI.generateBulkCertificates(data);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to generate certificates:', error);
      setError(error.response?.data?.message || 'Failed to generate certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificates = () => {
    // In a real implementation, this would download a ZIP file
    // For now, we'll just show an alert
    alert('Bulk download functionality would be implemented here');
  };

  const handleSendEmails = () => {
    // In a real implementation, this would send emails
    alert('Bulk email functionality would be implemented here');
  };

  return (
    <div className="bulk-certificate-generator">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <FileText className="mr-2" />
          Bulk Certificate Generator
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="mr-2" size={20} />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title} - {exam.subject}
                </option>
              ))}
            </select>
          </div>

          {/* Participants List */}
          {participants.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Completed Participants ({participants.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
                      <div>
                        <span className="font-medium">{participant.name}</span>
                        <span className="text-gray-500 ml-2">({participant.email})</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Score: {participant.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleGenerateCertificates}
              disabled={!selectedExam || participants.length === 0 || loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Upload className="mr-2" size={20} />
              {loading ? 'Generating...' : 'Generate Certificates'}
            </button>

            {results && (
              <>
                <button
                  onClick={handleDownloadCertificates}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Download className="mr-2" size={20} />
                  Download All
                </button>

                <button
                  onClick={handleSendEmails}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <Mail className="mr-2" size={20} />
                  Send Emails
                </button>
              </>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Generation Results</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl font-bold text-green-600">{results.success.length}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl font-bold text-red-600">{results.failed.length}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>

              {results.success.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                    <CheckCircle className="mr-1" size={16} />
                    Successfully Generated
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded p-3 max-h-40 overflow-y-auto">
                    {results.success.map((item, index) => (
                      <div key={index} className="text-sm text-green-800">
                        {item.certificateId} - Grade: {item.grade}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.failed.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                    <XCircle className="mr-1" size={16} />
                    Failed
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                    {results.failed.map((item, index) => (
                      <div key={index} className="text-sm text-red-800">
                        {item.studentId}: {item.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkCertificateGenerator;