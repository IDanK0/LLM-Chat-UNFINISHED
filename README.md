# LLM Chat (UNFINISHED)

A modern chat interface for interacting with large language models through LM Studio. This application allows you to converse with various LLM models in a clean, responsive interface.

## Overview

This project was developed as a web interface for interacting with language models such as Llama, Gemma, and Qwen. The application uses LM Studio as a backend for model inference and is optimized for both desktop and mobile devices.

**Important note**: This project is not complete, and there are several features in development or needing improvements. Contributions are welcome!

## Implemented Features

- ✅ Responsive chat interface with desktop and mobile support
- ✅ Support for different language models (Llama, Gemma, Qwen)
- ✅ Markdown formatting of responses
- ✅ Configurable settings panel
- ✅ Response caching to improve performance
- ✅ Automatic chat title generation
- ✅ Advanced response formatting support
- ✅ Chat history management
- ✅ Request text improvement function

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: Memory (in-memory storage)
- **API**: Communication with LM Studio for model inference
- **Other tools**: React Query, Wouter (routing), Zod (validation)

## How to Use

### Prerequisites

- Node.js (version 18 or higher)
- LM Studio installed and configured

### Installation

1. Clone the repository
```bash
git clone https://github.com/IDanK0/LLM-Chat-UNFINISHED
cd LLM-Chat-UNFINISHED
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser at `http://localhost:5000`

### Configuration

The application connects to LM Studio which must be running locally with the API server activated (usually on port 1234). You can modify the API URL and other settings in the application's settings panel.

## Known Issues and Incomplete Features

The application is still in development and has several incomplete or problematic areas:

1. **Web Search Support**: The API for web search is partially implemented but not fully integrated with all models.
   - Missing some tests and web search optimizations
   - Wikipedia integration is not fully functional

2. **Image Support**: Some models support image processing, but the user interface for uploading and managing images is not fully developed.
   - Missing implementation of image upload in the interface
   - Prompts for models that support images are not optimized

3. **Data Persistence**: Currently, data is stored only in memory, without a real database.
   - Missing database implementation
   - No real user authentication system

4. **Chat Management**: Creation, modification, and viewing of chats are implemented, but some features are missing:
   - Message deletion is not connected to a real API endpoint
   - Message editing is only simulated on the client side

5. **Mobile Optimization**: The interface has been optimized for mobile devices, but there may be usability issues on some devices.

## Development with LM Studio

This project uses [LM Studio](https://lmstudio.ai/) as a backend for model inference. LM Studio is a desktop application that allows you to run language models locally. To use this project, you need to:

1. Install LM Studio
2. Start LM Studio's local API server
3. Configure the API URL in the application (default: http://127.0.0.1:1234/v1/chat/completions)

## Contributions

Contributions are welcome! This project is incomplete, and there are many areas that can be improved. If you'd like to contribute, you can:

1. Open an issue to report a bug or propose a new feature
2. Fork the repository and submit a pull request with your changes
3. Improve documentation or add tests

### Areas That Need Contributions

- Complete implementation of web search
- Full support for image uploading and processing
- Data persistence system (database)
- User interface improvements
- Testing and documentation

## License

MIT