import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  candidates: [],
  currentCandidateId: null,
  activeTab: 'interviewee', // interviewee or interviewer
  viewMode: 'tabs', // 'tabs' or 'details'
};

export const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action) => {
      state.candidates.push(action.payload);
    },
    updateCandidate: (state, action) => {
      const index = state.candidates.findIndex((c) => c.id === action.payload.id);
      if (index === -1) return;
      const current = state.candidates[index];
      const incoming = action.payload;
      // Merge only provided fields, preserving existing ones unless explicitly set
      state.candidates[index] = {
        ...current,
        ...incoming,
        // Properly merge arrays - use incoming values if provided, otherwise keep current
        answers: incoming.answers !== undefined ? incoming.answers : current.answers,
        questions: incoming.questions !== undefined ? incoming.questions : current.questions,
        // Preserve other properties that might not be in the incoming update
        currentQuestionIndex: incoming.currentQuestionIndex !== undefined ? incoming.currentQuestionIndex : current.currentQuestionIndex,
        timeLeft: incoming.timeLeft !== undefined ? incoming.timeLeft : current.timeLeft,
        isPaused: incoming.isPaused !== undefined ? incoming.isPaused : current.isPaused,
        interviewStatus: incoming.interviewStatus !== undefined ? incoming.interviewStatus : current.interviewStatus,
        score: incoming.score !== undefined ? incoming.score : current.score,
        summary: incoming.summary !== undefined ? incoming.summary : current.summary,
      };
    },
    setCurrentCandidateId: (state, action) => {
      state.currentCandidateId = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload; // 'tabs' | 'details'
    },
    resetInterview: (state, action) => {
      const candidateId = action.payload;
      const candidateIndex = state.candidates.findIndex(c => c.id === candidateId);
      
      if (candidateIndex !== -1) {
        const candidate = state.candidates[candidateIndex];
        
        // Reset all interview-related data
        state.candidates[candidateIndex] = {
          ...candidate,
          interviewStatus: 'not_started',
          answers: [],
          questions: [],
          score: null,
          summary: '',
          timeLeft: 0,
          isPaused: false,
          currentQuestionIndex: 0,
          completedAt: null
        };
      }
    }
  },
});

export const { 
  addCandidate, 
  updateCandidate, 
  setCurrentCandidateId, 
  setActiveTab,
  setViewMode,
  resetInterview
} = candidatesSlice.actions;

export default candidatesSlice.reducer;