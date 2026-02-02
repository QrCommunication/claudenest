---
name: security
description: Security guidelines and best practices for secure development
version: 1.0.0
category: general
author: ClaudeNest
tags: [security, owasp, authentication, authorization]
---

# Security Guidelines

Essential security practices for building secure applications and protecting user data.

## OWASP Top 10

### 1. Injection (SQL, NoSQL, OS Command)
**Risk**: Attackers inject malicious code through user input

**Prevention**:
```python
# BAD - Never do this!
cursor.execute(f"SELECT * FROM users WHERE id = '{user_id}'")

# GOOD - Use parameterized queries
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

```javascript
// GOOD - Use ORM or parameterized queries
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### 2. Broken Authentication
**Risk**: Weak authentication allows account takeover

**Prevention**:
- Use strong password policies (min 12 chars, complexity)
- Implement multi-factor authentication (MFA)
- Set secure session timeouts
- Use secure password hashing (bcrypt, Argon2)
- Rate limit login attempts

```python
# Password hashing with bcrypt
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt)

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed)
```

### 3. Sensitive Data Exposure
**Risk**: Unencrypted data at rest or in transit

**Prevention**:
- Use HTTPS everywhere
- Encrypt sensitive data at rest
- Don't log sensitive information
- Use secure headers

```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### 4. XML External Entities (XXE)
**Risk**: XML parsers process external entities

**Prevention**:
```python
# Disable external entities in XML parsers
import xml.etree.ElementTree as ET

parser = ET.XMLParser()
parser.entity_declaration_handler = lambda *args: None
```

### 5. Broken Access Control
**Risk**: Users can access unauthorized resources

**Prevention**:
- Implement proper authorization checks
- Use principle of least privilege
- Deny by default
- Log access control failures

```python
# Decorator for authorization
def require_permission(permission):
    def decorator(func):
        @wraps(func)
        def wrapper(user, *args, **kwargs):
            if not user.has_permission(permission):
                raise PermissionDenied()
            return func(user, *args, **kwargs)
        return wrapper
    return decorator

@require_permission('users.delete')
def delete_user(user, target_user_id):
    # Only users with delete permission can reach here
    pass
```

### 6. Security Misconfiguration
**Risk**: Default configurations, unnecessary features, verbose errors

**Prevention**:
- Remove default accounts/passwords
- Disable unnecessary features
- Configure security headers
- Regular security patches

```python
# Security headers middleware
def security_headers_middleware(get_response):
    def middleware(request):
        response = get_response(request)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Content-Security-Policy'] = "default-src 'self'"
        return response
    return middleware
```

### 7. Cross-Site Scripting (XSS)
**Risk**: Malicious scripts injected into web pages

**Prevention**:
- Escape output
- Use Content Security Policy
- Validate and sanitize input
- Use modern frameworks with auto-escaping

```javascript
// BAD - vulnerable to XSS
element.innerHTML = userInput;

// GOOD - text content is safe
element.textContent = userInput;

// GOOD - use DOMPurify for HTML
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### 8. Insecure Deserialization
**Risk**: Untrusted data deserialized leads to remote code execution

**Prevention**:
- Don't deserialize untrusted data
- Use JSON instead of pickle/serialization
- Implement integrity checks
- Run deserialization in isolated environment

### 9. Using Components with Known Vulnerabilities
**Risk**: Dependencies have security flaws

**Prevention**:
- Keep dependencies updated
- Use dependency scanning tools
- Remove unused dependencies
- Subscribe to security advisories

```bash
# Scan for vulnerabilities
npm audit
pip-audit
safety check
```

### 10. Insufficient Logging and Monitoring
**Risk**: Attacks go undetected

**Prevention**:
- Log security events
- Set up alerts for suspicious activity
- Regular log review
- Maintain audit trails

```python
import logging

security_logger = logging.getLogger('security')

def log_security_event(event_type, user, details):
    security_logger.warning(
        f"Security event: {event_type}",
        extra={
            'user_id': user.id,
            'ip_address': request.remote_addr,
            'details': details
        }
    )
```

## Authentication Best Practices

### JWT Security
```python
# Secure JWT configuration
import jwt
from datetime import datetime, timedelta

def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1),
        'iat': datetime.utcnow(),
        'jti': str(uuid.uuid4())  # Unique token ID for revocation
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
```

### Session Security
- Use httpOnly cookies
- Set secure flag (HTTPS only)
- Set SameSite attribute
- Short expiration with refresh tokens

## API Security

### Rate Limiting
```python
from flask_limiter import Limiter

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute", "1000 per hour"]
)

@app.route('/api/login')
@limiter.limit("5 per minute")
def login():
    pass
```

### Input Validation
```python
from pydantic import BaseModel, validator

class UserRegistration(BaseModel):
    email: str
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        return v
```

## Secure Coding Checklist

- [ ] Input validation on all endpoints
- [ ] Output encoding for HTML/JS/SQL
- [ ] Authentication on all sensitive routes
- [ ] Authorization checks for every action
- [ ] HTTPS for all communications
- [ ] Secure session management
- [ ] Password hashing with bcrypt/Argon2
- [ ] Rate limiting on authentication
- [ ] Security headers configured
- [ ] Dependency vulnerability scanning
- [ ] Logging of security events
- [ ] Error handling without info leakage

## Incident Response

1. **Identify** - Detect and confirm the breach
2. **Contain** - Limit the damage
3. **Eradicate** - Remove the threat
4. **Recover** - Restore normal operations
5. **Learn** - Document and improve

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
