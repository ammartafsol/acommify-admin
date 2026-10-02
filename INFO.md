# Acommify Admin - Route Documentation

## 🌍 **LOCALE-BASED ROUTING**

**Base Structure**: `/en/route`

- **Supported Locales**: `en` (default)

---

## 📋 **ALL APPLICATION ROUTES**

### **🔐 Authentication Routes** _(Route Group: `(auth)`)_

```
/en/login                    → Login page
/en/forgot-password          → Forgot password page
/en/verify-otp               → OTP verification page
/en/reset-password           → Reset password page
```

### **🏠 Main Application Routes**

```
/en/                         → Root/Home page
/en/dashboard                → Dashboard page
/en/staffs                   → Staff management
/en/residents                → Residents management
/en/rooms-houses             → Rooms & Houses management (newly created)
/en/food-tokens              → Food tokens management
/en/incident-reports         → Incident reports
/en/maintenance-requests     → Maintenance requests
/en/manage-items             → Items management
/en/appointments             → Appointments management
/en/laundry-booking          → Laundry booking management
/en/visitor-booking          → Visitor booking management
/en/bus-booking              → Bus booking management
/en/bus-management           → Bus fleet management
/en/reports-analytics        → Reports and analytics
/en/notifications            → Notifications page
```

### **🚌 Dynamic Route with Slug**

```
/en/bus-booking/[slug]       → Bus booking details
                                  Example: /en/bus-booking/booking-123
                                  Example: /en/bus-booking/trip-456
```

### **📱 Mobile-Specific Routes** _(from headerDataMobile)_

```
/en/resident/notification    → Mobile notifications
/en/resident/settings        → Mobile settings
```

---

## 🔗 **COMPLETE ROUTE EXAMPLES**

### **Authentication Routes:**

```
/en/login
/en/forgot-password
/en/verify-otp
/en/reset-password
```

### **Main Application Routes:**

```
/en/dashboard
/en/staffs
/en/residents
/en/rooms-houses
/en/food-tokens
/en/incident-reports
/en/maintenance-requests
/en/manage-items
/en/appointments
/en/laundry-booking
/en/visitor-booking
/en/bus-booking
/en/bus-booking/booking-123     ← Dynamic slug example
/en/bus-management
/en/reports-analytics
/en/notifications
```

### **Mobile Routes:**

```
/en/resident/notification
/en/resident/settings
```

---

## 📝 **ROUTE CLASSIFICATION**

### **Static Routes** (21 routes)

- All main application routes without dynamic segments
- Authentication routes
- Mobile-specific routes

### **Dynamic Routes** (1 route)

- `/en/bus-booking/[slug]` - For individual bus booking details
  - **Slug examples**: `booking-123`, `trip-456`, `bus-789`

### **Route Groups**

- `(auth)` - Groups authentication-related routes

### **Protected Routes**

- All routes except authentication routes require user authentication
- Middleware handles locale routing automatically

---

## 🛠 **TECHNICAL DETAILS**

- **Router**: Next.js 14+ App Router
- **Internationalization**: next-intl with automatic locale detection
- **Middleware**: Handles locale routing and authentication
- **Dynamic Routing**: Uses `[slug]` pattern for variable segments
- **Route Generation**: Automatic based on file system structure
- **Default Locale**: en

---

## 🎯 **NAVIGATION MENU ROUTES**

### **Desktop Header Routes:**

```
/en/dashboard                → Dashboard
/en/staffs                   → Staffs
/en/residents                → Residents
/en/food-tokens              → Food Tokens
/en/incident-reports         → Incident Reports
/en/manage-items             → Manage Items
/en/reports-analytics        → Reports & Analytics
```

### **Mobile Header Routes:**

```
/en/dashboard                → Dashboard
/en/staffs                   → Staffs
/en/residents                → Residents
/en/food-tokens              → Food Tokens
/en/incident-reports         → Incident Reports
/en/manage-items             → Manage Items
/en/reports-analytics        → Reports & Analytics
/en/resident/notification    → Notifications
/en/resident/settings        → Settings
```

This structure provides a comprehensive admin panel with both static and dynamic
routing capabilities using the en locale.
