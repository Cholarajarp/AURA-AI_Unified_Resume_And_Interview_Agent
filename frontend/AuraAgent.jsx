import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Brain,
  BarChart3,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Award,
  Clock,
  Target,
  Loader,
  RefreshCw,
} from 'lucide-react';

// Determine API base URL based on environment
const getAPIBase = () => {
  // Both frontend and backend are served from the same domain/port
  // Frontend static files are served at root, API is at /api/* paths on the backend
  const protocol = window.location.protocol;
  const host = window.location.host; // includes port if not default
  return `${protocol}//${host}`;
};

const API_BASE = getAPIBase();

export default function AuraAgent() {
  // State management
  const [currentPage, setCurrentPage] = useState('upload');
  const [sessionId, setSessionId] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewAnswers, setInterviewAnswers] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setError(null);
    } else if (file) {
      setError('Please upload a PDF file');
    }
  };

  // Analyze resume
  const analyzeResume = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      setError('Please upload a resume and enter job description');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Step 1: Upload resume
      const formData = new FormData();
      formData.append('file', resumeFile);

      const uploadResp = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResp.ok) throw new Error('Failed to upload resume');

      const uploadData = await uploadResp.json();
      const newSessionId = uploadData.session_id;
      setSessionId(newSessionId);

      // Step 2: Analyze resume
      const analyzeResp = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: newSessionId,
          job_description: jobDescription,
        }),
      });

      if (!analyzeResp.ok) {
        const errorData = await analyzeResp.json();
        throw new Error(errorData.detail || `Failed to analyze resume (Status: ${analyzeResp.status})`);
      }

      const analysis = await analyzeResp.json();
      setAnalysisResults(analysis.analysis);
      setCurrentPage('analysis');
    } catch (err) {
      setError(err.message || 'Error analyzing resume');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Start interview
  const startInterview = async () => {
    if (!sessionId) {
      setError('Session not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(`${API_BASE}/start_interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!resp.ok) throw new Error('Failed to start interview');

      const data = await resp.json();
      setInterviewQuestions(data.questions || []);
      setCurrentQuestion(0);
      setInterviewAnswers([]);
      setCurrentPage('interview');
    } catch (err) {
      setError(err.message || 'Error starting interview');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!userAnswer.trim() || !sessionId) {
      setError('Please enter an answer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(`${API_BASE}/submit_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_index: currentQuestion,
          answer: userAnswer,
        }),
      });

      if (!resp.ok) throw new Error('Failed to submit answer');

      const data = await resp.json();
      const evaluation = data.evaluation;

      // Add answer to list
      const newAnswers = [
        ...interviewAnswers,
        {
          question_index: currentQuestion,
          question: interviewQuestions[currentQuestion],
          answer: userAnswer,
          score: evaluation.score,
          feedback: evaluation.feedback,
        },
      ];
      setInterviewAnswers(newAnswers);
      setUserAnswer('');

      // Check if complete
      if (data.is_complete) {
        setFinalScore(data.final_score);
        setCurrentPage('report');
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    } catch (err) {
      setError(err.message || 'Error submitting answer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset and start over
  const resetAll = () => {
    setCurrentPage('upload');
    setSessionId(null);
    setResumeFile(null);
    setJobDescription('');
    setAnalysisResults(null);
    setFinalScore(null);
    setInterviewAnswers([]);
    setCurrentQuestion(0);
    setUserAnswer('');
    setError(null);
  };

  // Export as CSV
  const exportCSV = () => {
    if (!analysisResults || !finalScore) return;

    const csv = [
      ['AURA Candidate Evaluation Report'],
      [],
      ['Candidate Information'],
      ['Name', analysisResults.name],
      ['Education', analysisResults.education],
      ['Experience', analysisResults.experience],
      [],
      ['Resume Scores'],
      ['Skill Match', analysisResults.skillMatch],
      ['Experience Match', analysisResults.experienceMatch],
      ['Project Relevance', analysisResults.projectRelevance],
      ['Education Match', analysisResults.educationMatch],
      ['Overall Resume Score', analysisResults.overallScore],
      [],
      ['Interview Performance'],
      ['Interview Score', finalScore.interviewScore.toFixed(1)],
      ['Final Score', finalScore.finalScore],
      ['Recommendation', finalScore.recommendation],
      [],
      ['Skills Detected'],
      ...analysisResults.skills.map((s) => [s]),
      [],
      ['Strengths'],
      ...analysisResults.strengths.map((s) => [s]),
      [],
      ['Areas for Improvement'],
      ...analysisResults.weaknesses.map((w) => [w]),
    ];

    const csvContent = csv.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aura_evaluation.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AURA</h1>
                <p className="text-xs text-purple-300">AI Unified Resume & Interview Agent</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {['upload', 'analysis', 'interview', 'report'].map((page, idx) => (
                <div
                  key={page}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    currentPage === page
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {idx + 1}. {page.charAt(0).toUpperCase() + page.slice(1)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Page */}
        {currentPage === 'upload' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-3">Welcome to AURA</h2>
              <p className="text-purple-300 text-lg">
                Upload a resume and let AI handle the screening process
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Resume Upload */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-all">
                <div className="flex items-center space-x-3 mb-6">
                  <Upload className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Upload Resume</h3>
                </div>

                <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-purple-500 transition-all cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <FileText className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    {resumeFile ? (
                      <p className="text-green-400 font-medium">{resumeFile.name}</p>
                    ) : (
                      <>
                        <p className="text-white font-medium mb-1">Click to upload PDF</p>
                        <p className="text-purple-300 text-sm">or drag and drop</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-all">
                <div className="flex items-center space-x-3 mb-6">
                  <FileText className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Job Description</h3>
                </div>

                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-48 bg-black/30 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={analyzeResume}
                disabled={!resumeFile || !jobDescription || analyzing}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center space-x-2"
              >
                {analyzing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Page */}
        {currentPage === 'analysis' && analysisResults && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">Resume Analysis</h2>

              {/* Candidate Info */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-white/10">
                  <p className="text-purple-300 text-sm mb-1">Candidate</p>
                  <p className="text-white font-bold text-xl">{analysisResults.name}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-white/10">
                  <p className="text-blue-300 text-sm mb-1">Education</p>
                  <p className="text-white font-bold text-xl">{analysisResults.education}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-white/10">
                  <p className="text-green-300 text-sm mb-1">Experience</p>
                  <p className="text-white font-bold text-xl">{analysisResults.experience}</p>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-8">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-400" />
                  Skills Detected
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                    Score Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Skill Match',
                        score: analysisResults.skillMatch,
                        max: 40,
                      },
                      {
                        label: 'Experience Match',
                        score: analysisResults.experienceMatch,
                        max: 30,
                      },
                      {
                        label: 'Project Relevance',
                        score: analysisResults.projectRelevance,
                        max: 20,
                      },
                      {
                        label: 'Education Match',
                        score: analysisResults.educationMatch,
                        max: 10,
                      },
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/70">{item.label}</span>
                          <span className="text-purple-300 font-medium">{item.score}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-white/10">
                  <div className="text-center">
                    <p className="text-purple-300 text-sm mb-2">Overall Resume Score</p>
                    <div className="relative inline-block">
                      <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {analysisResults.overallScore}
                      </div>
                      <span className="text-2xl text-white/50">/100</span>
                    </div>
                    <div className="mt-4">
                      {analysisResults.overallScore >= 80 && (
                        <span className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Strong Match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysisResults.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start text-green-300 text-sm">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {analysisResults.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start text-yellow-300 text-sm">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 mr-2" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={startInterview}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Starting Interview...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    <span>Start AI Interview</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Interview Page */}
        {currentPage === 'interview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">AI Interview</h2>
                <div className="flex items-center space-x-2 text-purple-300">
                  <Clock className="w-5 h-5" />
                  <span>
                    Question {currentQuestion + 1} of {interviewQuestions.length}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-8">
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${((currentQuestion + 1) / interviewQuestions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-white/10 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500 rounded-full p-3">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-purple-300 text-sm mb-2">AURA asks:</p>
                    <p className="text-white text-lg font-medium">
                      {interviewQuestions[currentQuestion]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer Input */}
              <div className="mb-6">
                <label className="text-white font-medium mb-2 block">Your Answer</label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full h-40 bg-black/30 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-all resize-none"
                />
              </div>

              {/* Previous Answers */}
              {interviewAnswers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3">Previous Responses</h3>
                  <div className="space-y-2">
                    {interviewAnswers.map((ans, idx) => (
                      <div key={idx} className="bg-black/30 rounded-lg p-3 border border-white/10">
                        <div className="flex justify-between items-center">
                          <p className="text-white/70 text-sm">
                            Q{idx + 1}: {ans.question.substring(0, 50)}...
                          </p>
                          <span className="text-green-400 font-medium text-sm">{ans.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={submitAnswer}
                  disabled={!userAnswer.trim() || loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <span>
                      {currentQuestion < interviewQuestions.length - 1
                        ? 'Next Question'
                        : 'Complete Interview'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Page */}
        {currentPage === 'report' && finalScore && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <Award className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-white mb-2">Evaluation Complete</h2>
              <p className="text-purple-300">Comprehensive HR assessment generated</p>
            </div>

            {/* Final Score Card */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <p className="text-purple-300 mb-4">Final HR Fit Score</p>
                <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  {finalScore.finalScore}
                </div>
                <div
                  className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                    finalScore.recommendation === 'Strong Yes'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : finalScore.recommendation === 'Yes'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}
                >
                  {finalScore.recommendation === 'Strong Yes' && (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  {finalScore.recommendation}
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-black/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-medium">Resume Score</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {finalScore.resumeScore}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full"
                      style={{ width: `${finalScore.resumeScore}%` }}
                    />
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-medium">Interview Score</span>
                    <span className="text-2xl font-bold text-pink-400">
                      {finalScore.interviewScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-pink-400 h-3 rounded-full"
                      style={{ width: `${finalScore.interviewScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-black/30 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                  Recruiter Summary
                </h3>
                <p className="text-white/80 leading-relaxed">{finalScore.summary}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 flex-wrap">
              <button
                onClick={exportCSV}
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold text-white hover:bg-white/20 transition-all flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={resetAll}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Screen Another Candidate</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-white/50 text-sm">
            AURA - Powered by AI • Streamlining HR with Intelligence
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
