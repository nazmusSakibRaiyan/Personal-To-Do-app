# Smart To-Do Development Guide

## Project Overview

This is a full-stack AI-powered to-do list application built with:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Python FastAPI + AI/NLP features
- State: Zustand with localStorage persistence

## Quick Start

### Terminal 1 - Frontend
```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

### Terminal 2 - Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
# Opens at http://localhost:8000
```

## Development Workflow

1. **Frontend Changes**: Edit files in `src/`, hot reload is automatic
2. **Backend Changes**: Edit `backend/main.py`, server restarts automatically
3. **Styling**: Edit Tailwind classes directly in components
4. **State**: Modify `src/store/useTodoStore.ts` for data management

## Key Files

- `src/App.tsx` - Main application and routing
- `src/store/useTodoStore.ts` - Global state management
- `src/pages/Dashboard.tsx` - Main dashboard view
- `src/components/QuickAdd.tsx` - Quick task creation
- `backend/main.py` - API endpoints and AI logic

## Adding New Features

### Frontend Component
```typescript
// src/components/MyComponent.tsx
import { useTodoStore } from '../store/useTodoStore'

export default function MyComponent() {
  const { tasks } = useTodoStore()
  return <div>My Component</div>
}
```

### Backend Endpoint
```python
# backend/main.py
@app.get("/api/my-endpoint")
def my_endpoint():
    return {"message": "Hello"}
```

### Store Action
```typescript
// src/store/useTodoStore.ts
myAction: () => {
  set((state) => ({ /* updates */ }))
}
```

## Testing

### Manual Testing
1. Create task with natural language
2. Check AI parsing works correctly
3. Verify filters and search
4. Test dark/light mode toggle
5. Export/import data

### API Testing
Visit http://localhost:8000/docs for interactive API documentation

## Common Tasks

### Add New Task Priority
1. Update `Task` type in `src/types/index.ts`
2. Add to priority filters in components
3. Update color scheme in `TaskCard.tsx`

### Add New Category
1. Use Settings page UI to add
2. Or programmatically via store

### Customize Theme
Edit `tailwind.config.js` colors

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies Issue
```bash
rm -rf node_modules package-lock.json
npm install
```

### Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## Performance Tips

- Keep components small and focused
- Use React.memo for expensive renders
- Lazy load pages with React.lazy()
- Optimize images and assets
- Use production build for deployment

## Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive component names
- Add comments for complex logic

## Deployment Checklist

- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Set environment variables
- [ ] Configure CORS for production domain
- [ ] Enable API rate limiting
- [ ] Set up error monitoring
- [ ] Configure backup strategy

## Resources

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand Guide](https://github.com/pmndrs/zustand)
