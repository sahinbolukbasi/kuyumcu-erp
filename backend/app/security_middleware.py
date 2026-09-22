import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

ALLOWED_ORIGINS = [v.strip().rstrip('/') for v in os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',') if v.strip()]

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method not in {'GET', 'HEAD', 'OPTIONS'}:
            origin = request.headers.get('origin')
            if origin and origin.rstrip('/') not in ALLOWED_ORIGINS:
                return JSONResponse({'detail': 'İzin verilmeyen kaynak.'}, status_code=403)
        length = request.headers.get('content-length')
        if length and (not length.isdigit() or int(length) > 3 * 1024 * 1024):
            return JSONResponse({'detail': 'İstek boyutu sınırı aşıldı.'}, status_code=413)
        response = await call_next(request)
        response.headers['Cache-Control'] = 'no-store, private'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'no-referrer'
        response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        if os.getenv('APP_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response
