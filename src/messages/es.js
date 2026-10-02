// src/messages/es.js
import auth from "./auth/es.json";
import common from "./common/es.json";
import appointments from "@/messages/pages/appointments/es.json";
import busBooking from "@/messages/pages/busBooking/es.json";
import busBookings from "@/messages/pages/busBookings/es.json";
import busManagementMessages from "@/messages/pages/busManagement/es.json";
import changePasswordMessages from "@/messages/pages/changePassword/es.json";
import cms from "@/messages/pages/cms/es.json";
import crud from "@/messages/pages/crud/es.json";
import documentCenter from "@/messages/pages/documentCenter/es.json";
import dashboard from "@/messages/pages/dashboard/es.json";
import faqs from "@/messages/pages/faqs/es.json";
import foodTokensMessages from "@/messages/pages/food-tokens/es.json";
import incidentReportsMessages from "@/messages/pages/incident-reports/es.json";
import laundryBooking from "@/messages/pages/laundryBooking/es.json";
import maintenanceRequestsMessages from "@/messages/pages/maintenance-requests/es.json";
import manageItemsMessages from "@/messages/pages/manage-items/es.json";
import notificationPage from "@/messages/pages/notificationPage/es.json";
import orders from "@/messages/pages/orders/es.json";
import orderDetailsPage from "@/messages/pages/orderDetail/es.json";
import positionPage from "@/messages/pages/positionPage/es.json";
import profileSetting from "@/messages/pages/profileSettings/es.json";
import reportsAnalyticsPage from "@/messages/pages/reportsAndAnalyticsPage/es.json";
import residentsMessages from "@/messages/pages/residents/es.json";
import roomsHouses from "@/messages/pages/roomsHouses/es.json";
import scheduleTimeSlots from "@/messages/pages/scheduleTimeSlots/es.json";
import staffsMessages from "@/messages/pages/staffs/es.json";
import timeSlots from "@/messages/pages/timeSlots/es.json";
import visitorBooking from "@/messages/pages/visitorBooking/es.json";
import configurationPage from "@/messages/pages/configurationCrud/es.json";
import signInOut from "@/messages/pages/signInOut/es.json";
import businessAdmin from "@/messages/pages/businessAdmin/es.json";
import nationwideDashboard from "@/messages/pages/nationwideDashboard/es.json";
import centersWeeklyReports from "@/messages/pages/centersWeeklyReports/es.json";
const messages = {
  ...auth, // Auth related messages
  ...common, // Common messages
  ...appointments, // Appointments messages
  ...busBooking, // Bus Booking messages
  ...busBookings, // Bus Bookings messages
  ...busManagementMessages, // Bus Management messages
  ...changePasswordMessages, // Change Password messages
  ...cms, // CMS messages
  ...crud, // CRUD messages
  ...dashboard, // Dashboard messages
  ...documentCenter, // Document Center messages
  ...faqs, // FAQs messages
  ...foodTokensMessages, // Food Tokens messages
  ...incidentReportsMessages, // Incident Reports messages
  ...laundryBooking, // Laundry Booking messages
  ...maintenanceRequestsMessages, // Maintenance Requests messages
  ...manageItemsMessages, // Manage Items messages
  ...notificationPage, // Notification Page messages
  ...orders, // Orders messages
  ...orderDetailsPage, // Order Details messages
  ...positionPage, // Position Page messages
  ...profileSetting, // Profile Settings messages
  ...reportsAnalyticsPage, // Reports and Analytics messages
  ...residentsMessages, // Residents messages
  ...roomsHouses, // Rooms & Houses messages
  ...scheduleTimeSlots, // Schedule Time Slots messages
  ...staffsMessages, // Staffs messages
  ...timeSlots, // Time Slots messages
  ...visitorBooking, // Visitor Booking messages
  ...configurationPage, // Configuration Page messages
  ...signInOut, // Sign In/Out messages
  ...businessAdmin, // Business Admin messages
  ...nationwideDashboard, // Nationwide Dashboard messages
  ...centersWeeklyReports, // Centers Weekly Reports messages
};

export default messages;
