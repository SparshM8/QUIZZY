import React, { useState, useEffect } from 'react';
import { Link2, Copy, RefreshCw, CheckCircle, Share2, Mail, MessageCircle } from 'lucide-react';
import { examsAPI } from '../api';

interface ExamInviteLinkProps {
  examId: string;
  examTitle: string;
  addNotification: (title: string, message: string, type: string) => void;
}

const ExamInviteLink: React.FC<ExamInviteLinkProps> = ({ examId, examTitle, addNotification }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadInviteLink();
  }, [examId]);

  const loadInviteLink = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.getInviteLink(examId);
      setInviteLink(response.data.joinUrl);
      setJoinCode(response.data.joinCode);
    } catch (error: any) {
      addNotification('Error', 'Failed to load invite link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    addNotification('Copied!', 'Invite link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    addNotification('Copied!', 'Join code copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateLink = async () => {
    if (!window.confirm('Are you sure you want to regenerate the invite link? The old link will no longer work.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await examsAPI.regenerateInviteLink(examId);
      setInviteLink(response.data.joinUrl);
      setJoinCode(response.data.joinCode);
      addNotification('Link Regenerated', 'New invite link has been generated', 'success');
    } catch (error: any) {
      addNotification('Error', 'Failed to regenerate invite link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShareEmail = () => {
    const subject = `Invitation to ${examTitle} - Quizzy`;
    const body = `You have been invited to take the exam: ${examTitle}

Join the exam using this link:
${inviteLink}

Or enter this code on the platform:
${joinCode}

Best regards,
Quizzy Team`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareWhatsApp = () => {
    const message = `Join the exam: *${examTitle}*\n\nLink: ${inviteLink}\n\nOr use code: *${joinCode}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Share Exam Invite</h3>
          <p className="text-sm text-gray-600">Share this link with students to join the exam</p>
        </div>
      </div>

      {/* Join Code Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Join Code</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-mono text-lg font-bold text-center tracking-widest text-gray-800">
            {loading ? 'Loading...' : joinCode}
          </div>
          <button
            onClick={handleCopyCode}
            disabled={loading || !joinCode}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Invite Link Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Invite Link</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-700 truncate">
            {loading ? 'Loading...' : inviteLink}
          </div>
          <button
            onClick={handleCopyLink}
            disabled={loading || !inviteLink}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            onClick={handleRegenerateLink}
            disabled={loading}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Quick Share</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={handleShareEmail}
            disabled={loading || !inviteLink}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Email</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            disabled={loading || !inviteLink}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-5 h-5 text-green-700" />
            <span className="text-sm font-medium text-green-700">WhatsApp</span>
          </button>
          <button
            onClick={handleCopyLink}
            disabled={loading || !inviteLink}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Link2 className="w-5 h-5 text-blue-700" />
            <span className="text-sm font-medium text-blue-700">Copy Link</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">How students can join:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Click the invite link directly</li>
          <li>Visit Quizzy and enter the join code</li>
          <li>Login or signup will be required before starting the exam</li>
        </ul>
      </div>
    </div>
  );
};

export default ExamInviteLink;
