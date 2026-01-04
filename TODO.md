# Project Backlog

### UI/UX
- [ ] **Rework DataSource Timer Functionality**: The timer and time tracking UI has been temporarily removed (commented out) from `DataSourceDetail.jsx` and `DataSourceQuickAction.jsx` in v1. It needs to be reworked to be more robust and user-friendly. The database schema (`total_processing_duration`, `daily_processing_duration`) has been preserved.
- [ ] Form validation across all form pages/screens


### Features:
- [ ] Add connection ability for Postgresql
- [ ] Add DDL specifically for Postgresql (could be hosted, or local)

### CI CD
- Build 
- Test using Pytest
- Testing using Playwright

## Deployment
- [ ] Dockerize the application
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production environment / docker hub