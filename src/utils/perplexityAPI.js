import axios from 'axios';

// Create a custom axios instance with better error handling
const perplexityAxios = axios.create({
  baseURL: 'https://api.perplexity.ai',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for debugging
perplexityAxios.interceptors.request.use(
  config => {
    console.log('Making API request:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? config.headers.Authorization.substring(0, 20) + '...' : 'none'
      }
    });
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
perplexityAxios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('General error:', error.message);
    }
    return Promise.reject(error);
  }
);

export class PerplexityAPI {
  static apiKey = (typeof import.meta !== 'undefined' && import.meta.env) 
    ? import.meta.env.VITE_PERPLEXITY_API_KEY || ''
    : process.env.VITE_PERPLEXITY_API_KEY || '';
  
  static isApiKeyAvailable() {
    console.log('Checking API key availability...');
    console.log('Raw API key value:', this.apiKey ? this.apiKey.substring(0, 15) + '...' : 'null/undefined');
    console.log('API key type:', typeof this.apiKey);
    console.log('API key length:', this.apiKey ? this.apiKey.length : 0);
    
    // Check if API key exists and is not the default placeholder
    const key = this.apiKey;
    if (!key) {
      console.warn('Perplexity API key is null or undefined');
      return false;
    }
    
    if (key === 'undefined') {
      console.warn('Perplexity API key is the string "undefined"');
      return false;
    }
    
    const trimmedKey = key.trim();
    if (trimmedKey === '') {
      console.warn('Perplexity API key is empty or whitespace');
      return false;
    }
    
    if (trimmedKey === 'your_perplexity_api_key_here') {
      console.warn('Perplexity API key is using default placeholder');
      return false;
    }
    
    // Check if API key has the correct prefix
    if (!trimmedKey.startsWith('pplx-')) {
      console.warn('Perplexity API key should start with "pplx-"');
      console.log('API key prefix:', trimmedKey.substring(0, 10) + '...');
      return false;
    }
    
    // Check if API key has the right length (should be around 50+ characters)
    if (trimmedKey.length < 30) {
      console.warn('Perplexity API key seems too short, got length:', trimmedKey.length);
      return false;
    }
    
    console.log('API key validation passed');
    return true;
  }
  
  static async checkApiKey() {
    // Debug log to check if API key is loaded
    console.log('Perplexity API Key Available:', this.isApiKeyAvailable());
    if (this.apiKey) {
      const trimmedKey = this.apiKey.trim();
      console.log('API Key prefix:', trimmedKey.substring(0, 10) + '...');
      console.log('API Key length:', trimmedKey.length);
    }
    
    const key = this.apiKey;
    if (!key || key === 'undefined' || key.trim() === '') {
      console.warn('Perplexity API key is missing or invalid');
      return false;
    }
    
    const trimmedKey = key.trim();
    
    // Check if API key has the correct prefix
    if (!trimmedKey.startsWith('pplx-')) {
      console.warn('Perplexity API key should start with "pplx-"');
      return false;
    }
    
    return true;
  }

  static async testConnection() {
    console.log('Starting Perplexity API connection test...');
    
    if (!await this.checkApiKey()) {
      console.log('API key check failed, returning failure');
      return { success: false, error: 'API key not available or invalid format' };
    }
    
    // Test with the most basic model first
    const testModels = [
      "llama-3.1-sonar-small-128k-online",
      "llama-3.1-sonar-large-128k-online",
      "sonar-small-online",
      "sonar-medium-online",
      "sonar"
    ];
    
    for (const model of testModels) {
      try {
        console.log(`Testing Perplexity API connection with model: ${model}...`);
        console.log('Using API key:', this.apiKey.substring(0, 10) + '...');
        
        const response = await perplexityAxios.post(
          '/chat/completions',
          {
            model: model,
            messages: [
              {
                role: "user",
                content: "Hello"
              }
            ],
            max_tokens: 5
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`Test API response status for ${model}:`, response.status);
        
        if (response.status === 200 && response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message.content;
          console.log(`Test API response content for ${model}:`, content);
          return { success: true, message: content, model: model };
        }
      } catch (error) {
        console.warn(`Failed to test with model ${model}:`, error.message);
        if (error.response) {
          console.error(`Response error for ${model}:`, error.response.status, error.response.data);
        }
        // Continue to next model
        continue;
      }
    }
    
    // If all models failed
    return { success: false, error: 'All test models failed. Please check your API key and account status.' };
  }

  static async generateQuestions(position, difficulty, count = 1) {
    if (!await this.checkApiKey()) {
      console.warn('Perplexity API key not available, returning default questions');
      return [];
    }
    
    // List of available models (in order of preference)
    const models = [
      "llama-3.1-sonar-small-128k-online",
      "llama-3.1-sonar-large-128k-online",
      "sonar-small-online",
      "sonar-medium-online",
      "sonar"
    ];
    
    for (const model of models) {
      try {
        console.log(`Attempting to generate questions with model: ${model}`);
        
        // Simplified prompt for better question generation
        const requestData = {
          model: model,
          messages: [
            {
              role: "user",
              content: `Generate ${count} ${difficulty} level technical interview questions for a ${position} position. 

List them as:
1. [question text]
2. [question text]

Focus on practical skills and real-world scenarios.`
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        };
        
        console.log('Request data:', JSON.stringify(requestData, null, 2));
        
        const response = await perplexityAxios.post(
          '/chat/completions',
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`Perplexity API response status for ${model}:`, response.status);

        if (response.status === 200 && response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message.content.trim();
          console.log(`Perplexity API response content for ${model}:`, content);
          
          // Parse the simple numbered list format
          const lines = content.split('\n').filter(line => line.trim() !== '');
          const questions = [];
          
          for (const line of lines) {
            // Look for numbered questions (1. 2. etc.)
            const questionMatch = line.match(/^\d+\.\s*(.+)$/);
            if (questionMatch) {
              const questionText = questionMatch[1].trim();
              if (questionText.length > 10) {
                questions.push({
                  question: questionText,
                  difficulty: difficulty,
                  timeLimit: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 60 : 120
                });
              }
            }
          }
          
          // If no numbered questions found, try to extract any meaningful lines
          if (questions.length === 0) {
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.length > 20 && trimmed.includes('?')) {
                questions.push({
                  question: trimmed,
                  difficulty: difficulty,
                  timeLimit: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 60 : 120
                });
                if (questions.length >= count) break;
              }
            }
          }
          
          if (questions.length > 0) {
            console.log(`Successfully generated ${questions.length} questions with model: ${model}`);
            return questions.slice(0, count); // Limit to requested count
          }
        }
      } catch (error) {
        console.warn(`Failed to generate questions with model ${model}:`, error.message);
        if (error.response) {
          console.error(`Error response for ${model}:`, error.response.status, error.response.data);
        }
        // Continue to the next model
        continue;
      }
    }
    
    // If all models fail, return some basic questions based on difficulty and position
    console.error('Failed to generate questions with all available models, using fallback questions');
    
    const fallbackQuestions = {
      'easy': [
        'What is the difference between let, const, and var in JavaScript?',
        'Explain what a function is and how to create one.',
        'What is the purpose of HTML and CSS?',
        'Describe what an API is in simple terms.'
      ],
      'medium': [
        'How do you handle asynchronous operations in JavaScript?',
        'Explain the concept of state management in React.',
        'What are the differences between SQL and NoSQL databases?',
        'Describe how you would optimize a slow-loading web page.'
      ],
      'hard': [
        'Design a scalable architecture for a high-traffic web application.',
        'Explain how you would implement real-time features in a web app.',
        'Describe your approach to handling security in a full-stack application.',
        'How would you design a system to handle millions of concurrent users?'
      ]
    };
    
    const difficultyKey = difficulty.toLowerCase();
    const availableQuestions = fallbackQuestions[difficultyKey] || fallbackQuestions['medium'];
    
    // Return random questions from the fallback set
    const selectedQuestions = [];
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      selectedQuestions.push({
        question: shuffled[i],
        difficulty: difficulty,
        timeLimit: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 60 : 120
      });
    }
    
    return selectedQuestions;
  }

  static async evaluateAnswer(question, answer, position) {
    if (!await this.checkApiKey()) {
      console.warn('Perplexity API key not available, returning default evaluation');
      return { score: 5, feedback: "Using default evaluation due to missing API key." };
    }

    // List of available models (in order of preference)
    const models = [
      "llama-3.1-sonar-small-128k-online",
      "llama-3.1-sonar-large-128k-online",
      "sonar-small-online",
      "sonar-medium-online",
      "sonar"
    ];
    
    for (const model of models) {
      try {
        console.log(`Attempting to evaluate answer with model: ${model}`);
        
        const requestData = {
          model: model,
          messages: [
            {
              role: "user",
              content: `Evaluate this interview answer for a ${position} position:

Question: "${question}"

Candidate's Answer: "${answer}"

Provide a score from 0-10 and brief feedback. Respond in this format:
Score: [number]
Feedback: [your feedback]`
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        };
        
        const response = await perplexityAxios.post(
          '/chat/completions',
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`Perplexity API response status for ${model}:`, response.status);

        if (response.status === 200 && response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message.content.trim();
          console.log(`Perplexity API response content for ${model}:`, content);
          
          try {
            // Parse the simple format: Score: X, Feedback: Y
            const scoreMatch = content.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
            const feedbackMatch = content.match(/feedback[:\s]*(.+?)(?:\n|$)/i);
            
            const score = scoreMatch ? Math.max(0, Math.min(10, parseFloat(scoreMatch[1]))) : 5;
            const feedback = feedbackMatch ? feedbackMatch[1].trim() : content.trim();
            
            console.log(`Successfully evaluated answer with model: ${model}`);
            return { score, feedback };
          } catch (e) {
            console.warn(`Failed to parse response from ${model}, using fallback`);
            console.log(`Full response content from ${model}:`, content);
            
            // Fallback: try to extract any number as score
            const scoreMatch = content.match(/(\d+(?:\.\d+)?)/);
            const score = scoreMatch ? Math.max(0, Math.min(10, parseFloat(scoreMatch[1]))) : 5;
            
            console.log(`Using fallback evaluation with model: ${model}`);
            return { 
              score, 
              feedback: content.length > 10 ? content.substring(0, 200) : "Unable to parse detailed feedback."
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to evaluate answer with model ${model}:`, error.message);
        if (error.response) {
          console.error(`Error response for ${model}:`, error.response.status, error.response.data);
          console.error(`Full error response:`, JSON.stringify(error.response.data, null, 2));
          
          // If it's a 400 error, the model might not exist or the request format is wrong
          if (error.response.status === 400) {
            console.warn(`Model ${model} returned 400 error, trying next model...`);
          }
        }
        // Continue to the next model
        continue;
      }
    }
    
    // If all models fail, return a basic evaluation based on answer length and keywords
    console.error('Failed to evaluate answer with all available models, using basic evaluation');
    
    // Basic evaluation based on answer content
    let score = 3; // Base score
    const answerLower = answer.toLowerCase();
    
    // Add points for answer length (shows effort)
    if (answer.length > 50) score += 1;
    if (answer.length > 100) score += 1;
    
    // Add points for technical keywords (basic heuristic)
    const technicalKeywords = ['function', 'variable', 'scope', 'closure', 'async', 'promise', 'component', 'state', 'props', 'api', 'database', 'server', 'client'];
    const foundKeywords = technicalKeywords.filter(keyword => answerLower.includes(keyword));
    score += Math.min(foundKeywords.length, 3); // Max 3 points for keywords
    
    score = Math.min(10, score); // Cap at 10
    
    return { 
      score, 
      feedback: `Basic evaluation: Answer shows ${score >= 7 ? 'good' : score >= 5 ? 'moderate' : 'limited'} technical understanding. ${foundKeywords.length > 0 ? `Mentioned relevant concepts: ${foundKeywords.slice(0, 3).join(', ')}.` : ''} Consider providing more detailed explanations.`
    };
  }

  static async generateSummary(candidateData, position) {
    if (!await this.checkApiKey()) {
      console.warn('Perplexity API key not available, returning default summary');
      return "Using default summary due to missing API key.";
    }

    // List of available models (in order of preference)
    const models = [
      "llama-3.1-sonar-small-128k-online",
      "llama-3.1-sonar-large-128k-online",
      "sonar-small-online",
      "sonar-medium-online",
      "sonar"
    ];
    
    for (const model of models) {
      try {
        console.log(`Attempting to generate summary with model: ${model}`);
        
        // Format the candidate's answers for the prompt
        const answersText = candidateData.answers.map((a, i) => {
          const question = candidateData.questions[i] || { question: "Unknown question" };
          return `Question ${i+1} (${question.difficulty || 'Unknown'}): ${question.question}
Answer: ${a.text || 'No answer provided'}
Score: ${a.score !== undefined ? a.score : 'N/A'}/10
Feedback: ${a.feedback || 'No feedback'}`;
        }).join('\n\n');
        
        const requestData = {
          model: model,
          messages: [
            {
              role: "user",
              content: `Write a brief interview summary for ${candidateData.name || 'this candidate'} applying for a ${position} position.

Interview Performance:
${answersText}

Provide a 2-3 paragraph summary covering their technical skills, strengths, areas for improvement, and hiring recommendation.`
            }
          ],
          temperature: 0.5,
          max_tokens: 600
        };
        
        const response = await perplexityAxios.post(
          '/chat/completions',
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`Perplexity API response status for ${model}:`, response.status);

        if (response.status === 200 && response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message.content.trim();
          console.log(`Perplexity API response content length for ${model}:`, content.length);
          console.log(`Perplexity API response content preview for ${model}:`, content.substring(0, 200) + '...');
          
          if (content && content.length > 50) {
            console.log(`Successfully generated summary with model: ${model}`);
            return content;
          }
        }
      } catch (error) {
        console.warn(`Failed to generate summary with model ${model}:`, error.message);
        if (error.response) {
          console.error(`Error response for ${model}:`, error.response.status, error.response.data);
        }
        // Continue to the next model
        continue;
      }
    }
    
    // If all models fail, return a structured default summary
    console.error('Failed to generate summary with all available models');
    
    // Create a basic summary based on available data
    const avgScore = candidateData.answers.length > 0 
      ? candidateData.answers.reduce((sum, a) => sum + (a.score || 0), 0) / candidateData.answers.length 
      : 0;
    
    const defaultSummary = `Interview Summary for ${candidateData.name || 'Candidate'}

Technical Skills Assessment: The candidate completed ${candidateData.answers.length} out of 6 interview questions with an average score of ${avgScore.toFixed(1)}/10.

Performance Overview: ${avgScore >= 7 ? 'Strong performance with good technical understanding.' : avgScore >= 5 ? 'Moderate performance with room for improvement.' : 'Below average performance, significant gaps in technical knowledge.'}

Areas for Improvement: Based on the interview responses, the candidate would benefit from additional practice and study in the technical areas covered.

Recommendation: ${avgScore >= 7 ? 'Consider for next round' : avgScore >= 5 ? 'Requires further evaluation' : 'Not recommended at this time'} based on current technical assessment.

Note: This is an automated summary. Manual review recommended for final hiring decisions.`;

    return defaultSummary;
  }
}

export default PerplexityAPI;