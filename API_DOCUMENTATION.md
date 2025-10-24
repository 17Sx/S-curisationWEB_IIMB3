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
**Rôle assigné:** USER (par défaut)

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
**Permission requise:** `can_post_login`

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
**Permission requise:** `can_get_my_user`  
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
**Permission requise:** `can_get_users`  
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

---

### 7. Create Product

**Endpoint:** `POST /products`  
**Authentification:** Requise  
**Permission requise:** `can_post_products`  
**Content-Type:** `application/json`  
**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "title": "Mon produit",
  "price": "19.99"
}
```

**Réponse (201):**

```json
{
  "id": 1,
  "shopifyId": "1234567890",
  "title": "Mon produit",
  "price": "19.99",
  "createdBy": 1,
  "salesCount": 0,
  "createdAt": "2025-10-22T12:00:00.000Z"
}
```

---

### 8. Get My Products

**Endpoint:** `GET /my-products`  
**Authentification:** Requise  
**Headers:**

```
Authorization: Bearer <token>
```

**Réponse (200):**

```json
{
  "products": [
    {
      "id": 1,
      "shopifyId": "1234567890",
      "salesCount": 0,
      "createdAt": "2025-10-22T12:00:00.000Z",
      "updatedAt": "2025-10-22T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 9. Get All Products

**Endpoint:** `GET /products`  
**Authentification:** Requise  
**Headers:**

```
Authorization: Bearer <token>
```

**Réponse (200):**

```json
{
  "products": [
    {
      "id": 1,
      "shopifyId": "1234567890",
      "createdBy": 1,
      "salesCount": 0,
      "createdAt": "2025-10-22T12:00:00.000Z",
      "creatorName": "John Doe",
      "creatorEmail": "john@example.com"
    }
  ],
  "total": 1
}
```

---

### 10. API Keys Management

**Endpoint:** `GET /apikey`  
**Authentification:** Requise (JWT ou API Key)

**Headers:**

```
Authorization: Bearer <token>
# OU
X-API-Key: <api_key>
```

**Réponse (200):**

```json
[
  {
    "id": "abc123",
    "name": "Mon API Key",
    "createdAt": "n/a"
  }
]
```

---

### 11. Create API Key

**Endpoint:** `POST /apikey`  
**Authentification:** Requise (JWT ou API Key)  
**Content-Type:** `application/json`

**Headers:**

```
Authorization: Bearer <token>
# OU
X-API-Key: <api_key>
```

**Body:**

```json
{
  "name": "Mon API Key"
}
```

**Réponse (200):**

```json
{
  "id": "abc123",
  "name": "Mon API Key",
  "key": "apikey_xyz789"
}
```

---

### 12. Delete API Key

**Endpoint:** `DELETE /apikey`  
**Authentification:** Requise (JWT ou API Key)  
**Content-Type:** `application/json`

**Headers:**

```
Authorization: Bearer <token>
# OU
X-API-Key: <api_key>
```

**Body:**

```json
{
  "id": "abc123"
}
```

**Réponse (200):**

```json
{
  "message": "API key deleted"
}
```

---

### 13. Shopify Sales Webhook

**Endpoint:** `POST /webhooks/shopify-sales`  
**Authentification:** Signature HMAC-SHA256  
**Content-Type:** `application/json`  
**Headers:**

```
X-Shopify-Hmac-Sha256: <signature_base64>
```

**Description:** Webhook appelé automatiquement par Shopify lors de la création d'une commande. Met à jour le `sales_count` des produits vendus en fonction de la quantité.

**Body (exemple de payload Shopify):**

```json
{
  "id": 820982911946154508,
  "line_items": [
    {
      "product_id": 632910392,
      "quantity": 2
    }
  ]
}
```

**Réponse (200):**

```json
{
  "message": "Webhook traité avec succès",
  "orderId": 820982911946154508,
  "productsUpdated": 2,
  "productsFailed": 0
}
```