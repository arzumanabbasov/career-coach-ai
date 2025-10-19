# 🚀 ShekarchAI - AI-Powered Career Coach

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.6-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Elasticsearch-8.0-005571?style=for-the-badge&logo=elasticsearch" alt="Elasticsearch" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google" alt="Google Gemini" />
</div>

<div align="center">
  <h3>🤖 Intelligent Career Guidance with LinkedIn Integration</h3>
  <p>Get personalized career advice powered by AI, real-time job market data, and your LinkedIn profile analysis.</p>
</div>

---

## ✨ Features

### 🧠 **Intelligent AI Chatbot**
- **Context-Aware Conversations**: Remembers your chat history for better responses
- **Smart Decision Making**: Automatically determines when to use job market data vs. general advice
- **Personalized Guidance**: Tailored recommendations based on your profile and experience level

### 📊 **LinkedIn Integration**
- **Profile Analysis**: Automatic scraping and analysis of LinkedIn profiles
- **Career Insights**: Detailed breakdown of your professional background
- **Skill Assessment**: Identifies strengths and areas for improvement

### 💼 **Job Market Intelligence**
- **Real-Time Data**: Live job postings from LinkedIn
- **Market Analysis**: Comprehensive statistics on job trends, salaries, and requirements
- **Company Insights**: Top hiring companies and locations for your field

### 🔒 **Enterprise-Grade Security**
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Input Validation**: Comprehensive sanitization and validation
- **CORS Protection**: Secure cross-origin resource sharing
- **Environment Variables**: Secure API key management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Elasticsearch cluster
- Google Gemini API key
- Apify API token

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/arzumanabbasov/career-coach-ai.git
cd career-coach-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Elasticsearch Configuration
ELASTICSEARCH_URL=your_elasticsearch_url
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key
ELASTICSEARCH_INDEX_NAME=linkedin-jobs-webhook

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# Apify Scraping
APIFY_API_TOKEN=your_apify_token
APIFY_ACTOR_ID=your_actor_id
LINKEDIN_SCRAPER_ACTOR_ID=your_scraper_actor_id

# Security
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
API_RATE_LIMIT=100
API_RATE_WINDOW=900000
ALLOWED_ORIGINS=http://localhost:3000

# Environment
NODE_ENV=development
```

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── job-statistics/  # Job market data collection
│   │   ├── scrape-jobs/     # LinkedIn job scraping
│   │   ├── scrape-linkedin/ # LinkedIn profile scraping
│   │   └── search-jobs/     # Intelligent job search with AI
│   ├── chat/               # Chat interface
│   └── page.tsx            # Landing page
├── components/
│   ├── ChatInterface.tsx   # Main chat component
│   └── OnboardingWizard.tsx # User onboarding
└── lib/
    ├── config.ts           # Environment configuration
    ├── elasticsearch.ts    # Elasticsearch utilities
    ├── middleware.ts       # Security middleware
    ├── security.ts         # Security utilities
    └── types.ts            # TypeScript definitions
```

## 🎯 How It Works

### 1. **Intelligent Decision Making**
The AI analyzes your question to determine if job market data is needed:
- **Skills questions** → Uses Elasticsearch data
- **Interview prep** → Direct AI response
- **Salary queries** → Combines job data + AI insights

### 2. **Smart Query Generation**
Gemini creates optimized search queries for Elasticsearch:
- "What skills do I need?" → "data scientist skills"
- "Best companies?" → "software engineer companies"

### 3. **Contextual Responses**
Combines multiple data sources:
- Your LinkedIn profile
- Real-time job market data
- Previous conversation history
- AI-generated insights

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized
- **Rate Limiting**: Configurable limits per endpoint
- **CORS Protection**: Secure cross-origin requests
- **API Key Management**: Environment-based configuration
- **Error Handling**: Secure error messages without sensitive data

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search-jobs` | POST | Intelligent job search with AI |
| `/api/job-statistics` | POST | Job market data collection |
| `/api/scrape-linkedin` | POST | LinkedIn profile scraping |
| `/api/scrape-jobs` | POST | LinkedIn job scraping |

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add environment variables**
4. **Deploy automatically**

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for AI capabilities
- **Elasticsearch** for search and analytics
- **Apify** for web scraping infrastructure
- **Next.js** for the amazing framework
- **Tailwind CSS** for beautiful styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/arzumanabbasov/career-coach-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/arzumanabbasov/career-coach-ai/discussions)
- **Email**: a.arzuman313@gmail.com

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=arzumanabbasov/career-coach-ai&type=Date)](https://star-history.com/#arzumanabbasov/career-coach-ai&Date)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/arzumanabbasov">Arzuman Abbasov</a></p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
```
