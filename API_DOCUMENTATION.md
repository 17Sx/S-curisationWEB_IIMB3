## Endpoints

### 1. Health Check

**Endpoint:** `GET /health` ou `POST /health`  
**Authentification:** Non requise

**Réponse (200):**

```json
{
  "status": "ok",
  "timestamp": "2025-10-22T10:30:00.000Z"
}
```

---

### 2. Register

**Endpoint:** `POST /register`  
**Authentification:** Non requise  
**Content-Type:** `application/json`

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Réponse (201):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 3. Login

**Endpoint:** `POST /login`  
**Authentification:** Non requise  
**Content-Type:** `application/json`  
**Rate Limit:** 1 tentative toutes les 5 secondes par utilisateur

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Réponse (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 4. Get My User

**Endpoint:** `GET /my-user`  
**Authentification:** Requise  
**Headers:**

```
Authorization: Bearer <token>
```

**Réponse (200):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-10-22T10:00:00.000Z",
  "updatedAt": "2025-10-22T10:00:00.000Z"
}
```

### 5. Get All Users

**Endpoint:** `GET /users`  
**Authentification:** Requise  
**Headers:**

```
Authorization: Bearer <token>
```

**Réponse (200):**

```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-10-22T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2025-10-22T11:00:00.000Z"
    }
  ],
  "total": 2
}
```

### 6. Change Password

**Endpoint:** `PATCH /change-password`  
**Authentification:** Requise  
**Content-Type:** `application/json`  
**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Réponse (200):**

```json
{
  "message": "Mot de passe changé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```
